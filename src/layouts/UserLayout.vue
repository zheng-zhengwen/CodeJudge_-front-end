<template>
  <div id="userLayout">
    <a-layout style="min-height: 100vh" class="centered-layout">
      <a-layout-header class="header">
        <a-space>
          <img src="../assets/thisLogo.png" class="logo" />
          <div class="title">在线编程系统</div>
        </a-space>
      </a-layout-header>
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
      <a-layout-footer class="footer">
        <div class="footer-content">
          <div class="footer-info">
            <span>© 2025 WEN </span>
            <span class="divider">|</span>
            <span> 在线编程平台</span>
          </div>
        </div>
      </a-layout-footer>
    </a-layout>
  </div>
</template>

<script setup lang="ts"></script>
<style scoped>
#userLayout {
  text-align: center;
  background: url(../assets/immersive-background.jpg) 0% 0% / 100% 100%;
}

#userLayout .logo {
  width: 88px;
  height: 88px;
}

#userLayout .header {
  margin-top: 16px;
}

#userLayout .content {
  margin-bottom: 16px;
  padding: 20px;
}

#userLayout .footer {
  background: rgba(246, 249, 250, 0.9);

  padding: 5px 0;
  color: #666;
  padding: 14px;
  position: sticky;
  bottom: 0;
  right: 0;
  left: 0;
  backdrop-filter: blur(10px);
}

#userLayout .title {
  font-size: 30px;
  font-weight: bold;
  animation: rainbow 5s linear infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
}

@keyframes rainbow {
  0% {
    background-image: linear-gradient(to right, red, orange, yellow);
  }
  25% {
    background-image: linear-gradient(to right, orange, yellow, green);
  }
  50% {
    background-image: linear-gradient(to right, yellow, green, blue);
  }
  75% {
    background-image: linear-gradient(to right, green, blue, indigo);
  }
  100% {
    background-image: linear-gradient(to right, blue, indigo, violet);
  }
}
</style>
