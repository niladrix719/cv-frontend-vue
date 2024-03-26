import { reactive } from 'vue';

const alertState = reactive({
  messages: [] as { id: number; text: string; class: string }[],
  prevErrorMessage: "",
  prevShowMessage: ""
});

export default function UseAlertMessage() {
  function showError(error: string) {
    if (error === alertState.prevErrorMessage) return;

    alertState.prevErrorMessage = error;
    let id = Math.floor(Math.random() * 10000);
    alertState.messages.push({ id, text: error, class: 'alert alert-danger' });

    setTimeout(() => {
      alertState.messages = alertState.messages.filter((message) => message.id !== id);
      alertState.prevErrorMessage = "";
    }, 1500);
  }

  function showMessage(mes: string) {
    if (mes === alertState.prevShowMessage) return;

    alertState.prevShowMessage = mes;
    let id = Math.floor(Math.random() * 10000);
    alertState.messages.push({ id, text: mes || '', class: 'alert alert-success' });

    setTimeout(() => {
      alertState.messages = alertState.messages.filter((message) => message.id !== id);
      alertState.prevShowMessage = "";
    }, 2500);
  }

  return {
    messages: alertState.messages,
    showError,
    showMessage
  };
}
