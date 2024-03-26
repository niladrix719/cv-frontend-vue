<template>
  <div id="MessageDiv">
    <div v-for="(message, index) in messages" :key="index" :class="message.class" role="alert">
      {{ message.text }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import UseAlertMessage from '#/hooks/UseAlertMessage';

const { messages } = UseAlertMessage();
</script>

<style scoped>
#MessageDiv {
  position: absolute;
  margin-left: 30px;
  bottom: 100px;
  left: 30px;
  bottom: 30px;
  z-index: 110;
}
</style>
