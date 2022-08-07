const CSS_ROOT = ":root";
const APP_ROOT = "ytd-app";
const CHAT = "#chat";
const CHAT_SIBLING = "#chat-template";
const VIDEO_CONTAINER = "#ytd-player #container";
const VIDEO = "ytd-watch-flexy";
const TOGGLE_BUTTON = "#show-hide-button";

const OVERLAY_CLASS = "overlay";
const HIDDEN_CLASS = "hidden";
const LEFT_CLASS = "left";
const RIGHT_CLASS = "right";

const FULLSCREEN_ATTRIBUTE = "fullscreen";

const OPACITY_VAR = "--opacity";
const CHAT_HEIGHT_VAR = "--chat-height";

const STORAGE_OPTIONS = "options";

window.onload = async () => {
  const options = (await chrome.storage.local.get(STORAGE_OPTIONS)).options;
  console.log("Loading options:", options);

  const cssRoot = document.querySelector(CSS_ROOT);
  const appRoot = document.querySelector(APP_ROOT);
  const chat = await tryLoad(CHAT); if (!chat) return;
  const chatSibling = document.querySelector(CHAT_SIBLING);

  const videoContainer = document.querySelector(VIDEO_CONTAINER);
  const video = await tryLoad(VIDEO); if (!video) return;

  onOptionsUpdated(options);
  registerAttributeObserver(video, FULLSCREEN_ATTRIBUTE, () => onOptionsUpdated(options));

  chrome.storage.onChanged.addListener(changes => {
    const options = changes.options.newValue;
    console.log("Reloading options:", options);
    onOptionsUpdated(options);
  });

  function onOptionsUpdated(options) {
    updateTreePosition();
    updateCssPosition();
    updateStyleVariables();
    updateToggleButton();

    function updateTreePosition() {
      console.debug("Updating tree position:", options.enabled);
      if (!(options.enabled && isFullscreen())) {
        restoreOldPosition();
      } else if (chat.parentNode !== videoContainer) {
        console.debug("Chat old parent node:", chat.parentNode);
        videoContainer.appendChild(chat);
      }

      function restoreOldPosition() {
        const originalParent = chatSibling.parentNode;
        if (chat.parentNode !== originalParent) {
          console.debug("Restoring original parent node:", originalParent);
          originalParent.insertBefore(chat, chatSibling);
        }
      }

      function isFullscreen() {
        return video.hasAttribute(FULLSCREEN_ATTRIBUTE);
      }
    }

    function updateCssPosition() {
      console.debug("Update position:", options.position);
      switch (options.position) {
        case LEFT_CLASS:
          chat.classList.add(LEFT_CLASS);
          chat.classList.remove(RIGHT_CLASS);
          break;
        case RIGHT_CLASS:
          chat.classList.add(RIGHT_CLASS);
          chat.classList.remove(LEFT_CLASS);
          break;
      }
    }

    function updateStyleVariables() {
      cssRoot.style.setProperty(OPACITY_VAR, options.opacity);
      cssRoot.style.setProperty(CHAT_HEIGHT_VAR, options.height);
    }

    function updateToggleButton() {
      chat.querySelector(TOGGLE_BUTTON).classList.toggle(HIDDEN_CLASS, !options.toggleButton);
    }
  }

  async function tryLoad(selector) {
    try {
      return await pollNode(appRoot, selector);
    } catch (e) {
      if (e instanceof Error) {
        console.error("Failed to load", selector, e);
      } else {
        console.warn("Failed to load", selector, e);
      }
      return null;
    }
  }
}
