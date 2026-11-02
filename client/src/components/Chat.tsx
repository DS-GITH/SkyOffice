import React, { useRef, useState, useEffect } from 'react'
import styled from 'styled-components'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import Badge from '@mui/material/Badge'
import InsertEmoticonOutlinedIcon from '@mui/icons-material/InsertEmoticonOutlined'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import 'emoji-mart/css/emoji-mart.css'
import { Picker } from 'emoji-mart'

import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'

import { useAppDispatch, useAppSelector } from '../hooks'
import { MessageType, setFocused, setShowChat } from '../stores/ChatStore'
import { IChatMessage } from '../../../types/IOfficeState'
import { glass, InitialsAvatar } from './ui/Glass'

const SIDEBAR_WIDTH = 340
const GROUP_WINDOW_MS = 5 * 60 * 1000

const Sidebar = styled.aside`
  ${glass};
  position: fixed;
  z-index: 12;
  top: calc(var(--topbar-h) + 24px);
  left: 12px;
  bottom: 12px;
  width: ${SIDEBAR_WIDTH}px;
  max-width: calc(100vw - 24px);
  border-radius: var(--radius-panel);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideIn 0.18s ease-out;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-12px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 10px 14px 20px;
    border-bottom: 1px solid var(--border);

    h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
    }

    small {
      color: var(--text-faint);
      font-size: 12px;
    }
  }
`

const Messages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px 12px 4px;
  display: flex;
  flex-direction: column;

  .empty {
    margin: auto;
    text-align: center;
    color: var(--text-faint);
    font-size: 13px;
    line-height: 1.6;
    padding: 24px;
  }
`

const Group = styled.div<{ $mine: boolean }>`
  display: flex;
  gap: 10px;
  padding: 6px 4px;

  .body {
    min-width: 0;
    flex: 1;
  }

  .meta {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 2px;

    strong {
      font-size: 13px;
      font-weight: 600;
      color: ${(p) => (p.$mine ? 'var(--brand-soft-fg)' : 'var(--text)')};
    }

    time {
      font-size: 11px;
      color: var(--text-faint);
    }
  }

  p {
    margin: 0 0 3px;
    font-size: 14px;
    line-height: 1.45;
    color: rgb(255 255 255 / 0.86);
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }
`

const Notice = styled.div`
  align-self: center;
  margin: 6px 0;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--text-faint);
  font-size: 12px;
`

const Composer = styled.form`
  position: relative;
  margin: 8px 12px 12px;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 4px 4px 14px;
  border-radius: 16px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  transition: border-color 0.15s, box-shadow 0.15s;

  &:focus-within {
    border-color: var(--brand);
    box-shadow: 0 0 0 4px rgb(43 127 255 / 0.15);
  }

  .emoji-picker {
    position: absolute;
    bottom: calc(100% + 8px);
    right: 0;
    z-index: 2;
  }
`

const Rail = styled.button`
  all: unset;
  position: fixed;
  z-index: 12;
  top: calc(var(--topbar-h) + 24px);
  left: 12px;
  width: 52px;
  height: 52px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  cursor: pointer;
  background: var(--surface-overlay);
  backdrop-filter: blur(var(--glass-blur)) saturate(170%);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-float);
  color: var(--text);
  transition: background 0.15s;

  &:hover {
    background: var(--surface-3);
  }
`

const timeFormat = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

type Entry = { messageType: MessageType; chatMessage: IChatMessage }

/** Consecutive messages from the same author (within 5 min) share one header. */
function groupMessages(entries: Entry[]) {
  const groups: Array<{ notice?: Entry; author?: string; createdAt?: number; items?: Entry[] }> =
    []
  entries.forEach((entry) => {
    if (entry.messageType !== MessageType.REGULAR_MESSAGE) {
      groups.push({ notice: entry })
      return
    }
    const last = groups[groups.length - 1]
    const { author, createdAt } = entry.chatMessage
    if (
      last?.items &&
      last.author === author &&
      createdAt - last.items[last.items.length - 1].chatMessage.createdAt < GROUP_WINDOW_MS
    ) {
      last.items.push(entry)
    } else {
      groups.push({ author, createdAt, items: [entry] })
    }
  })
  return groups
}

export default function Chat() {
  const [inputValue, setInputValue] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const focusedAt = useRef(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatMessages = useAppSelector((state) => state.chat.chatMessages)
  const focused = useAppSelector((state) => state.chat.focused)
  const showChat = useAppSelector((state) => state.chat.showChat)
  const unreadCount = useAppSelector((state) => state.chat.unreadCount)
  const onlineCount = useAppSelector((state) => state.room.onlineCount)
  const myName = useAppSelector((state) => state.auth.user?.name)
  const dispatch = useAppDispatch()
  const game = phaserGame.scene.keys.game as Game

  const close = () => {
    inputRef.current?.blur()
    setShowEmojiPicker(false)
    dispatch(setShowChat(false))
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') close()
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const val = inputValue.trim()

    // The Enter that opens the chat from the game can also reach this form right after
    // the input gets focus. Ignore that empty submit instead of closing the chat.
    if (!val && Date.now() - focusedAt.current < 400) return

    // move focus back to the game
    inputRef.current?.blur()
    setShowEmojiPicker(false)

    setInputValue('')
    if (val) {
      game.network.addChatMessage(val)
      game.myPlayer.updateDialogBubble(val)
    }
  }

  useEffect(() => {
    if (focused) inputRef.current?.focus()
  }, [focused, showChat])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, showChat])

  if (!showChat) {
    return (
      <Tooltip title="Abrir chat (Enter)" placement="right">
        <Rail
          aria-label="Abrir chat"
          onClick={() => {
            dispatch(setShowChat(true))
            dispatch(setFocused(true))
          }}
        >
          <Badge badgeContent={unreadCount} color="primary" max={99}>
            <ChatBubbleOutlineIcon fontSize="small" />
          </Badge>
        </Rail>
      </Tooltip>
    )
  }

  const groups = groupMessages(chatMessages)

  return (
    <Sidebar>
      <header>
        <div>
          <h3>Chat do workspace</h3>
          <small>{onlineCount} pessoas online</small>
        </div>
        <Tooltip title="Recolher (Esc)">
          <IconButton size="small" aria-label="Recolher chat" onClick={close}>
            <KeyboardDoubleArrowLeftIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </header>

      <Messages>
        {groups.length === 0 && (
          <div className="empty">
            Nenhuma mensagem ainda.
            <br />
            Diga um oi para o time!
          </div>
        )}
        {groups.map((group, index) =>
          group.notice ? (
            <Notice key={index}>
              {group.notice.chatMessage.author} {group.notice.chatMessage.content}
            </Notice>
          ) : (
            <Group key={index} $mine={group.author === myName}>
              <InitialsAvatar name={group.author || '?'} size={30} />
              <div className="body">
                <div className="meta">
                  <strong>{group.author}</strong>
                  <time>{timeFormat.format(new Date(group.createdAt!))}</time>
                </div>
                {group.items!.map((item, i) => (
                  <p key={i}>{item.chatMessage.content}</p>
                ))}
              </div>
            </Group>
          )
        )}
        <div ref={messagesEndRef} />
      </Messages>

      <Composer onSubmit={handleSubmit}>
        {showEmojiPicker && (
          <div className="emoji-picker">
            <Picker
              theme="dark"
              showSkinTones={false}
              showPreview={false}
              color="#2b7fff"
              i18n={{ search: 'Buscar', notfound: 'Nada encontrado' }}
              onSelect={(emoji) => {
                setInputValue(inputValue + emoji.native)
                setShowEmojiPicker(false)
                dispatch(setFocused(true))
              }}
              exclude={['recent', 'flags']}
            />
          </div>
        )}
        <InputBase
          inputRef={inputRef}
          autoFocus={focused}
          fullWidth
          placeholder="Escreva uma mensagem…"
          value={inputValue}
          inputProps={{ maxLength: 500 }}
          onKeyDown={handleKeyDown}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => {
            focusedAt.current = Date.now()
            if (!focused) dispatch(setFocused(true))
          }}
          onBlur={() => dispatch(setFocused(false))}
          sx={{ fontSize: 14 }}
        />
        <IconButton
          size="small"
          aria-label="Emoji"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          <InsertEmoticonOutlinedIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          type="submit"
          aria-label="Enviar"
          disabled={!inputValue.trim()}
          // keep focus in the input so the click submits right away
          onMouseDown={(e) => e.preventDefault()}
          sx={{ color: 'var(--brand)' }}
        >
          <SendRoundedIcon fontSize="small" />
        </IconButton>
      </Composer>
    </Sidebar>
  )
}
