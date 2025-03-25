<template>
  <div id="app">
    <BasicLayout></BasicLayout>
  </div>
</template>

<style></style>
<script setup lang="ts">
import BasicLayout from "@/layouts/BasicLayout.vue";
import { onMounted } from "vue";

const doInit = () => {
  console.log("hello 欢迎来到我的项目");
};
onMounted(() => {
  doInit();
});
</script>
