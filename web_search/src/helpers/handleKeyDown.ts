//https://www.toptal.com/developers/keycode
//https://www.youtube.com/watch?v=uCIC2LNt0bk&list=PLNYkxOF6rcICWx0C9LVWWVqvHlYJyqw7g&index=6&ab_channel=GoogleChromeDevelopers
const handleKeyDown = (
  event: globalThis.KeyboardEvent,
  idx: number,
  length: number,
  idElt = "card_"
) => {
  //event.preventDefault()
  const selectedDiv = document.getElementById(`${idElt}${idx}`)!;
  const nextSelectedDiv = document.getElementById(`${idElt}${idx + 1}`)!;
  const prevSelectedDiv = document.getElementById(`${idElt}${idx - 1}`)!;
  //pour la compatibilité => voir https://developer.mozilla.org/fr/docs/Web/API/Element/keydown_event
  if (selectedDiv) {
    if (event.isComposing || event.keyCode === 229) {
      return;
    }
    if (
      event.keyCode === 37 ||
      event.key === "ArrowLeft" ||
      event.which === 37
    ) {
      selectedDiv.tabIndex = -1;
      if (idx === 0) {
        document.getElementById(`${idElt}${length - 1}`)!.tabIndex = 0;
        document.getElementById(`${idElt}${length - 1}`)!.focus();
      } else {
        prevSelectedDiv.tabIndex = 0;
        prevSelectedDiv.focus();
      }
    }
    if (
      event.keyCode === 39 ||
      event.key === "ArrowRight" ||
      event.which === 39
    ) {
      selectedDiv.tabIndex = -1;
      if (idx === length - 1) {
        document.getElementById(`${idElt}0`)!.tabIndex = 0;
        document.getElementById(`${idElt}0`)!.focus();
      } else {
        nextSelectedDiv.tabIndex = 0;
        nextSelectedDiv.focus();
      }
    }
  }
};

export default handleKeyDown;
