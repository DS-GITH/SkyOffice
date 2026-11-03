import Phaser from 'phaser'
import { decodeAvatar } from './options'
import { renderSheet, FRAME_H, FRAME_W } from './render'

const PREFIX = 'av-'

/** Texture key for an avatar code. Never contains "_" (anim keys are "<texture>_<state>_<dir>"). */
export const avatarTextureKey = (code: string) => `${PREFIX}${code}`

const ANIMS: Array<{ name: string; start: number; end: number; loop: boolean; rate: number }> = [
  { name: 'idle_right', start: 0, end: 5, loop: true, rate: 9 },
  { name: 'idle_up', start: 6, end: 11, loop: true, rate: 9 },
  { name: 'idle_left', start: 12, end: 17, loop: true, rate: 9 },
  { name: 'idle_down', start: 18, end: 23, loop: true, rate: 9 },
  { name: 'run_right', start: 24, end: 29, loop: true, rate: 15 },
  { name: 'run_up', start: 30, end: 35, loop: true, rate: 15 },
  { name: 'run_left', start: 36, end: 41, loop: true, rate: 15 },
  { name: 'run_down', start: 42, end: 47, loop: true, rate: 15 },
  { name: 'sit_down', start: 48, end: 48, loop: false, rate: 15 },
  { name: 'sit_left', start: 49, end: 49, loop: false, rate: 15 },
  { name: 'sit_right', start: 50, end: 50, loop: false, rate: 15 },
  { name: 'sit_up', start: 51, end: 51, loop: false, rate: 15 },
]

/**
 * Generates (once) the spritesheet + animations for an avatar code.
 * Returns the texture key, or null if the code is invalid.
 */
export function ensureAvatarTexture(scene: Phaser.Scene, code: string): string | null {
  const config = decodeAvatar(code)
  if (!config) return null
  const key = avatarTextureKey(code)

  if (!scene.textures.exists(key)) {
    const canvas = renderSheet(config)
    scene.textures.addSpriteSheet(key, canvas as unknown as HTMLImageElement, {
      frameWidth: FRAME_W,
      frameHeight: FRAME_H,
    })
  }

  const anims = scene.anims
  ANIMS.forEach(({ name, start, end, loop, rate }) => {
    const animKey = `${key}_${name}`
    if (anims.exists(animKey)) return
    anims.create({
      key: animKey,
      frames: anims.generateFrameNumbers(key, { start, end }),
      repeat: loop ? -1 : 0,
      frameRate: rate,
    })
  })
  return key
}

/**
 * Makes sure an animation key coming from the network can be played.
 * Generated avatars are built on demand from the code embedded in the key.
 */
export function ensureAnimation(scene: Phaser.Scene, animKey: string) {
  if (scene.anims.exists(animKey)) return true
  const textureKey = animKey.split('_')[0]
  if (!textureKey.startsWith(PREFIX)) return false
  ensureAvatarTexture(scene, textureKey.slice(PREFIX.length))
  return scene.anims.exists(animKey)
}
