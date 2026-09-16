/**
 * 启动骨架（App Shell）逻辑
 *
 * 由 index.html 在首帧前同步加载（<script src="/boot/boot.js">），完全脱离 Vue。
 * 做两件事：
 *   1. 主题预置：读应用保存的配置，把明暗写入 <html data-theme>
 *   2. 暴露 window.__boot：骨架自身的 DOM 操作接口，供应用层（bootstrapStore）调用
 *
 * 注意：本文件在 public/ 下，不经过 Vite 编译，因此：
 *   - 不能用 import.meta.env / %VITE_*%
 *   - localStorage 的 key 由 index.html 的 <html data-boot-storage-key> 传入（那里支持环境变量替换）
 */
;(function () {
  'use strict'

  var DARK_QUERY = '(prefers-color-scheme: dark)'
  var root = document.documentElement

  /** 读取应用保存的主题模式（dark / light / system） */
  function readSavedMode() {
    var key = root.getAttribute('data-boot-storage-key')
    // 环境变量未替换时 key 仍含有 %，此时跳过本地存储
    if (!key || key.indexOf('%') !== -1) {
      return null
    }
    try {
      var raw = localStorage.getItem(key)
      if (!raw) {
        return null
      }
      var saved = JSON.parse(raw)
      return saved && saved.mode ? saved.mode : null
    } catch (e) {
      return null
    }
  }

  /** 与 configProviderStore.getTheme() 保持一致的解析规则 */
  function resolveTheme() {
    var mode = readSavedMode()
    if (mode === 'dark') {
      return 'dark'
    }
    if (mode === 'light') {
      return 'light'
    }
    return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
  }

  root.setAttribute('data-theme', resolveTheme())

  /** 骨架自管 DOM；应用层只调这几个方法（文案由 i18n 翻译好后传入） */
  window.__boot = {
    /** 每次执行启动管线前复位（首次是空操作，重试时用于恢复 spinner） */
    reset: function () {
      var spinner = document.getElementById('boot-spinner')
      if (spinner) {
        spinner.style.display = ''
      }
      var status = document.getElementById('boot-status')
      if (status) {
        status.textContent = ''
      }
      var box = document.getElementById('boot-error')
      if (box) {
        box.setAttribute('hidden', '')
      }
    },

    setStatus: function (text) {
      var el = document.getElementById('boot-status')
      if (text && el) {
        el.textContent = text
      }
    },

    showError: function (message, retryLabel, onRetry) {
      var spinner = document.getElementById('boot-spinner')
      if (spinner) {
        spinner.style.display = 'none'
      }
      var status = document.getElementById('boot-status')
      if (status) {
        status.textContent = ''
      }
      var box = document.getElementById('boot-error')
      var text = document.getElementById('boot-error-text')
      var retry = document.getElementById('boot-retry')
      if (text) {
        text.textContent = message || ''
      }
      if (retry) {
        retry.textContent = retryLabel || ''
        retry.onclick = function () {
          if (onRetry) {
            onRetry()
          }
        }
      }
      if (box) {
        box.removeAttribute('hidden')
      }
    },

    remove: function () {
      var shell = document.getElementById('boot-shell')
      if (shell) {
        shell.remove()
      }
    },
  }
})()
