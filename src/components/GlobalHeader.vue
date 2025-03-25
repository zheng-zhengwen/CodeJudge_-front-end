<template>
  <a-row
    align="center"
    id="globalHeader"
    :wrap="false"
    style="background-color: #2c6545"
  >
    <a-col flex="auto">
      <a-menu
        mode="horizontal"
        :selected-keys="selectedKeys"
        @menu-item-click="doMenuClick"
        style="background-color: #2c6545"
      >
        <a-menu-item
          key="0"
          :style="{ padding: 0, marginRight: '30px' }"
          disabled
        >
          <div class="title-bar">
            <!--            <img src="@/assets/thisLogo.png" alt="" class="logo" />-->
            <div class="title">在线编程系统</div>
            <img src="@/assets/index_ico_03.png" alt="" class="logo" />
          </div>
        </a-menu-item>
        <a-menu-item
          v-for="item in visibleRoutes"
          :key="item.path"
          :style="{
            backgroundColor: selectedKeys.includes(item.path)
              ? '#ffffff'
              : '#2c6545',
            color: selectedKeys.includes(item.path) ? '#2c6545' : 'white',
          }"
          @click="doMenuClick(item.path)"
        >
          {{ item.name }}
        </a-menu-item>
      </a-menu>
    </a-col>
    <a-col flex="100px">
      <div>{{ store.state.user?.loginUser?.userName ?? "未登录" }}</div>
    </a-col>
  </a-row>
</template>

<script lang="ts" setup>
import { routes } from "../router/routes";
import { useRouter } from "vue-router";
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { useStore } from "vuex";
import checkAccess from "@/access/checkAccess";
import ACCESS_ENUM from "@/access/accessEnum";

const router = useRouter();
const store = useStore();

// 展示在菜单的路由数组
const visibleRoutes = computed(() => {
  return routes.filter((item, index) => {
    if (item.meta?.hideInMenu) {
      return false;
    }
    // 根据权限过滤菜单
    if (!checkAccess(store.state.user.loginUser, item.meta?.access as string)) {
      return false;
    }
    return true;
  });
});

// 默认主页
const selectedKeys = ref(["/"]);

// 新增：窗口宽度和折叠状态
const windowWidth = ref(window.innerWidth);
const collapseThreshold = 992; // 根据实际调整阈值
const isCollapsed = ref(false);

// 新增：窗口监听
const handleResize = () => {
  windowWidth.value = window.innerWidth;
  isCollapsed.value = windowWidth.value < collapseThreshold;
};

onMounted(() => {
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
});

// 路由跳转后，更新激活项（修改此处）
router.afterEach((to, from, next) => {
  // 仅在未折叠时更新选中项
  if (!isCollapsed.value) {
    selectedKeys.value = [to.path];
  }
});

const doMenuClick = (key: string) => {
  router.push({
    path: key,
  });
  selectedKeys.value = [key]; // 点击时无论折叠与否都更新
};

console.log(store.state.user);
setTimeout(() => {
  store.dispatch("user/getLoginUser", {
    userName: "测试管理员",
    userRole: ACCESS_ENUM.ADMIN,
  });
}, 3000);
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.title-bar {
  display: flex;
  flex-direction: column; /* 设置主轴方向为垂直方向 */
  background-color: #2c6545;
}

.title {
  /**color: #444;**/
  font-size: 20px;
  margin-left: 100px;
  font-weight: bold;
  animation: rainbow 5s linear infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
}

@keyframes rainbow {
  0% {
    background-image: linear-gradient(to right, #ffe4e1, #fffaf0, #ffffe0);
  }
  25% {
    background-image: linear-gradient(to right, #fffaf0, #ffffe0, #f0fff0);
  }
  50% {
    background-image: linear-gradient(to right, #ffffe0, #f0fff0, #e0ffff);
  }
  75% {
    background-image: linear-gradient(to right, #f0fff0, #e0ffff, #f0f8ff);
  }
  100% {
    background-image: linear-gradient(to right, #e0ffff, #f0f8ff, #ffe4e1);
  }
}

.logo {
  height: 48px;
}

/* 可针对收缩项单独写样式 */
.collapse-menu-item {
  background-color: #2c6545 !important;
}
</style>
