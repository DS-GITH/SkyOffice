import Peer from 'peerjs'
import Network from '../services/Network'
import store from '../stores'
import { setMediaState } from '../stores/UserStore'

type MediaKind = 'audio' | 'video'

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

/**
 * Stand-in camera: a dark card with the user's initials. Calls always start with one audio
 * and one video track, so turning the real camera/mic on later is just a track swap
 * (no renegotiation, the conversation doesn't drop).
 */
function createPlaceholderVideoTrack(name: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 320
  canvas.height = 240
  const ctx = canvas.getContext('2d')!
  const paint = () => {
    ctx.fillStyle = '#16181d'
    ctx.fillRect(0, 0, 320, 240)
    ctx.fillStyle = 'rgba(43,127,255,0.22)'
    ctx.beginPath()
    ctx.arc(160, 120, 44, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#8cc2ff'
    ctx.font = '600 32px "General Sans", system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(initialsOf(name), 160, 122)
  }
  paint()
  // keep producing frames so the remote <video> keeps playing
  const interval = window.setInterval(paint, 1000)
  const track = (canvas as any).captureStream(5).getVideoTracks()[0] as MediaStreamTrack
  return { track, stop: () => window.clearInterval(interval) }
}

/** Stand-in microphone: a silent audio track. */
function createSilentAudioTrack() {
  const Ctor = window.AudioContext || (window as any).webkitAudioContext
  const ctx: AudioContext = new Ctor()
  return ctx.createMediaStreamDestination().stream.getAudioTracks()[0]
}

export default class WebRTC {
  private myPeer: Peer
  private peers = new Map<string, { call: Peer.MediaConnection; video: HTMLVideoElement }>()
  private onCalledPeers = new Map<string, { call: Peer.MediaConnection; video: HTMLVideoElement }>()
  private videoGrid = document.querySelector('.video-grid')
  private myVideo = document.createElement('video')
  private myStream: MediaStream
  private stopPlaceholder?: () => void
  private network: Network

  constructor(userId: string, network: Network) {
    const sanitizedId = this.replaceInvalidId(userId)
    this.myPeer = new Peer(sanitizedId)
    this.network = network
    this.myPeer.on('error', (err) => {
      console.error('[webrtc]', err.type, err)
    })

    // Start with stand-in tracks; real camera/mic replace them when allowed.
    const placeholder = createPlaceholderVideoTrack(store.getState().auth.user?.name || '?')
    this.stopPlaceholder = placeholder.stop
    this.myStream = new MediaStream([createSilentAudioTrack(), placeholder.track])

    // mute your own video stream (you don't want to hear yourself)
    this.myVideo.muted = true
    this.myVideo.classList.add('self')

    // config peerJS
    this.initialize()
  }

  // PeerJS throws invalid_id error if it contains some characters such as that colyseus generates.
  // https://peerjs.com/docs.html#peer-id
  private replaceInvalidId(userId: string) {
    return userId.replace(/[^0-9a-z]/gi, 'G')
  }

  initialize() {
    this.myPeer.on('call', (call) => {
      if (!this.onCalledPeers.has(call.peer)) {
        call.answer(this.myStream)
        const video = document.createElement('video')
        this.onCalledPeers.set(call.peer, { call, video })

        call.on('stream', (userVideoStream) => {
          this.addVideoStream(video, userVideoStream)
        })
      }
      // on close is triggered manually with deleteOnCalledVideoStream()
    })
  }

  /** Re-enables the devices the user already allowed in a previous visit. */
  checkPreviousPermission() {
    const checks: Array<[string, MediaKind]> = [
      ['microphone', 'audio'],
      ['camera', 'video'],
    ]
    checks.forEach(([name, kind]) => {
      navigator.permissions
        ?.query({ name: name as PermissionName })
        .then((result) => {
          if (result.state === 'granted') this.enableDevice(kind, false)
        })
        .catch(() => {})
    })
  }

  /** Asks the browser for the camera ('video') or the microphone ('audio') separately. */
  async enableDevice(kind: MediaKind, alertOnError = true) {
    const label = kind === 'audio' ? 'o microfone' : 'a câmera'
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported')
      const media = await navigator.mediaDevices.getUserMedia(
        kind === 'audio' ? { audio: true } : { video: true }
      )
      const track = kind === 'audio' ? media.getAudioTracks()[0] : media.getVideoTracks()[0]
      this.swapTrack(track)

      if (kind === 'video') {
        this.stopPlaceholder?.()
        this.stopPlaceholder = undefined
        if (!this.myVideo.isConnected) this.addVideoStream(this.myVideo, this.myStream)
        store.dispatch(setMediaState({ hasCam: true, camOn: true }))
      } else {
        store.dispatch(setMediaState({ hasMic: true, micOn: true }))
      }
      return true
    } catch (error) {
      if (alertOnError) {
        window.alert(
          `Não foi possível acessar ${label}. Verifique se ele está conectado e se o navegador tem permissão para usá-lo.`
        )
      }
      return false
    }
  }

  /** Puts a new track in our stream and in every open call (no renegotiation needed). */
  private swapTrack(track: MediaStreamTrack) {
    const old = this.myStream.getTracks().find((t) => t.kind === track.kind)
    if (old) {
      this.myStream.removeTrack(old)
      old.stop()
    }
    this.myStream.addTrack(track)

    const calls = [...this.peers.values(), ...this.onCalledPeers.values()]
    calls.forEach(({ call }) => {
      const sender = call.peerConnection
        ?.getSenders()
        .find((s) => s.track?.kind === track.kind || (old && s.track === old))
      sender?.replaceTrack(track).catch((err) => console.error('[webrtc] replaceTrack', err))
    })
  }

  // method to call a peer
  connectToNewUser(userId: string) {
    const sanitizedId = this.replaceInvalidId(userId)
    if (!this.peers.has(sanitizedId)) {
      const call = this.myPeer.call(sanitizedId, this.myStream)
      const video = document.createElement('video')
      this.peers.set(sanitizedId, { call, video })

      call.on('stream', (userVideoStream) => {
        this.addVideoStream(video, userVideoStream)
      })

      // on close is triggered manually with deleteVideoStream()
    }
  }

  // method to add new video stream to videoGrid div
  addVideoStream(video: HTMLVideoElement, stream: MediaStream) {
    video.srcObject = stream
    video.playsInline = true
    video.autoplay = true
    video.addEventListener('loadedmetadata', () => {
      video.play().catch(() => {})
    })
    video.play().catch(() => {})
    if (this.videoGrid) this.videoGrid.append(video)
  }

  // method to remove video stream (when we are the host of the call)
  deleteVideoStream(userId: string) {
    const sanitizedId = this.replaceInvalidId(userId)
    if (this.peers.has(sanitizedId)) {
      const peer = this.peers.get(sanitizedId)
      peer?.call.close()
      peer?.video.remove()
      this.peers.delete(sanitizedId)
    }
  }

  // method to remove video stream (when we are the guest of the call)
  deleteOnCalledVideoStream(userId: string) {
    const sanitizedId = this.replaceInvalidId(userId)
    if (this.onCalledPeers.has(sanitizedId)) {
      const onCalledPeer = this.onCalledPeers.get(sanitizedId)
      onCalledPeer?.call.close()
      onCalledPeer?.video.remove()
      this.onCalledPeers.delete(sanitizedId)
    }
  }

  /** Mic button: asks for permission the first time, then mutes/unmutes. */
  toggleAudio() {
    if (!store.getState().user.hasMic) return this.enableDevice('audio')
    const track = this.myStream.getAudioTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    store.dispatch(setMediaState({ micOn: track.enabled }))
  }

  /** Camera button: asks for permission the first time, then turns it on/off. */
  toggleVideo() {
    if (!store.getState().user.hasCam) return this.enableDevice('video')
    const track = this.myStream.getVideoTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    store.dispatch(setMediaState({ camOn: track.enabled }))
  }
}
