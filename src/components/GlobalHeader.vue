<template>
  <a-row
    align="center"
    id="globalHeader"
    :wrap="false"
    :style="{ backgroundColor: headerBgColor }"
  >
    <a-col flex="auto">
      <a-menu
        mode="horizontal"
        :selected-keys="selectedKeys"
        @menu-item-click="doMenuClick"
        :style="{ backgroundColor: headerBgColor }"
        :default-selected-keys="['1']"
      >
        <a-menu-item
          key="0"
          :style="{ padding: 0, marginRight: '20px' }"
          disabled
        >
          <div class="title-bar">
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
              : headerBgColor,
            color: selectedKeys.includes(item.path) ? headerBgColor : 'white',
          }"
          @click="doMenuClick(item.path)"
        >
          {{ item.name }}
        </a-menu-item>
      </a-menu>
    </a-col>
    <a-col flex="auto" class="user-info-wrapper">
      <div class="user-info">
        <a-dropdown trigger="hover">
          <a-avatar shape="circle">
            <template
              v-if="loginUser && loginUser.userRole as string !== ACCESS_ENUM.NOT_LOGIN"
            >
              <template v-if="userAvatar">
                <img alt="avatar" :src="userAvatar" class="userAvatar" />
              </template>
              <template v-else>
                <a-avatar>
                  <IconUser />
                </a-avatar>
              </template>
            </template>
          </a-avatar>
          <template #content>
            <template
              v-if="loginUser && loginUser.userRole as string !== ACCESS_ENUM.NOT_LOGIN"
            >
              <a-doption>
                <template #icon>
                  <icon-idcard />
                </template>
                <template #default>
                  <a-anchor-link @click="handleClick">个人信息</a-anchor-link>
                </template>
              </a-doption>
              <a-doption>
                <template #icon>
                  <icon-poweroff />
                </template>
                <template #default>
                  <a-anchor-link @click="logout">退出登录</a-anchor-link>
                </template>
              </a-doption>
            </template>
            <template v-else>
              <a-doption>
                <template #icon>
                  <icon-user />
                </template>
                <template #default>
                  <a-anchor-link href="/user/login">登录</a-anchor-link>
                </template>
              </a-doption>
            </template>
          </template>
        </a-dropdown>
        <div class="user-name">
          {{ store.state.user?.loginUser?.userName ?? "未登录" }}
        </div>
      </div>
    </a-col>
  </a-row>

  <!-- 个人信息对话框 -->
  <a-modal v-model:visible="visible" @ok="handleOk" :footer="false">
    <template #title>用户简介</template>
    <div>
      <a-descriptions size="mini" :data="data" bordered />
    </div>
    <a-button
      @click="openModalForm(loginUser.id)"
      style="margin-top: 10px"
      :visible="visible2"
    >
      修改个人信息
    </a-button>
  </a-modal>

  <!-- 修改个人信息对话框 -->
  <a-modal
    width="30%"
    :visible="visible2"
    placement="right"
    @ok="handleOk2"
    @cancel="closeModel"
    unmountOnClose
  >
    <div style="text-align: center; margin-bottom: 20px">
      <a-upload
        action="/"
        :show-file-list="false"
        :custom-request="uploadAvatar"
        accept="image/*"
      >
        <template #upload-button>
          <a-avatar :size="80" shape="circle">
            <img
              v-if="userInfo?.userAvatar"
              alt="头像"
              :src="userInfo.userAvatar"
            />
            <icon-user v-else />
          </a-avatar>
        </template>
      </a-upload>
      <div style="margin-top: 10px; color: var(--color-text-2)">
        点击头像更换
      </div>
    </div>
    <a-form title="个人信息" style="max-width: 360px; margin: 0 auto">
      <a-form-item field="名称" label="名称 :">
        <a-input v-model="userInfo.userName" placeholder="请输入用户名称" />
      </a-form-item>
      <a-form-item field="账号" label="账号 :" disabled>
        <a-input v-model="userInfo.userAccount" placeholder="请输入账号" />
      </a-form-item>
      <a-form-item field="用户角色" label="角色 :" disabled>
        <a-select v-model="userInfo.userRole" placeholder="请输入用户角色">
          <a-option value="admin">管理员</a-option>
          <a-option value="user">普通用户</a-option>
        </a-select>
      </a-form-item>
      <a-form-item field="userProfile" label="简介 :">
        <a-textarea v-model="userInfo.userProfile" placeholder="请输入简介" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
import { routes } from "../router/routes";
import { useRouter } from "vue-router";
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { useStore } from "vuex";
import checkAccess from "@/access/checkAccess";
import ACCESS_ENUM from "@/access/accessEnum";
import {
  User,
  UserControllerService,
  FileControllerService,
} from "../../generated";
import message from "@arco-design/web-vue/es/message";
import moment from "moment";

const router = useRouter();
const store = useStore();

// 展示在菜单的路由数组
const visibleRoutes = computed(() => {
  return routes.filter((item, index) => {
    if (item.meta?.hideInMenu) {
      return false;
    }
    if (!checkAccess(store.state.user.loginUser, item.meta?.access as string)) {
      return false;
    }
    return true;
  });
});

// 退出登录
const logout = async () => {
  try {
    await UserControllerService.userLogoutUsingPost();
    store.commit("user/setLoginUser", {
      userName: "未登录",
      userRole: ACCESS_ENUM.NOT_LOGIN,
      userAvatar: "",
    });
    localStorage.removeItem("token");
    sessionStorage.clear();
    router.push("/user/login").then(() => {
      location.reload();
    });
  } catch (error) {
    message.error("退出登录失败");
  }
};

// 默认主页
const selectedKeys = ref(["/"]);

// 窗口响应式处理
const windowWidth = ref(window.innerWidth);
const collapseThreshold = 1000;
const isCollapsed = ref(false);
const loginUser = store.state.user.loginUser;
const userAvatar = loginUser.userAvatar;

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

router.afterEach((to) => {
  if (!isCollapsed.value) {
    selectedKeys.value = [to.path];
  }
});

const doMenuClick = (key: string) => {
  router.push({
    path: key,
  });
  selectedKeys.value = [key];
};

// 定义背景色变量
const headerBgColor = "#2c6545";

// 个人信息弹窗相关
const visible = ref(false);
const handleClick = () => {
  visible.value = true;
};
const handleOk = () => {
  visible.value = false;
};

const data = computed(() => {
  return [
    {
      label: "用户名称",
      value: loginUser.userName,
    },
    {
      label: "用户id",
      value: loginUser.id,
    },
    {
      label: "简介",
      value: loginUser.userProfile,
    },
    {
      label: "注册时间",
      value: moment(loginUser.createTime).format("YYYY-MM-DD hh:mm"),
    },
  ];
});

// 修改个人信息弹窗
const visible2 = ref(false);
const userInfo = ref<User>({
  userName: "",
  userAccount: "",
  userRole: "",
  userProfile: "",
  userAvatar: "",
});
const userAvatarImg = ref("");

// const openModalForm = async (userId: any) => {
//   const res = await UserControllerService.getUserByIdUsingGet(userId);
//   userInfo.value = res.data;
//   userAvatarImg.value = res.data?.userAvatar || "";
//   visible2.value = true;
// };
const openModalForm = async (userId: any) => {
  const res = await UserControllerService.getUserByIdUsingGet(userId);
  userInfo.value = {
    ...res.data,
    userPassword: "", // 清空密码字段
  };
  userAvatarImg.value = res.data?.userAvatar || "";
  visible2.value = true;
};

/**
 * 上传头像
 */
const uploadAvatar = async (options: any) => {
  const file = options.fileItem.file;
  const userId = loginUser?.id;

  if (!userId) {
    message.error("用户未登录");
    return;
  }

  try {
    if (!file) {
      message.error("请选择要上传的文件");
      return;
    }

    // 检查文件类型
    if (!file.type.startsWith("image/")) {
      message.error("请上传图片文件");
      return;
    }

    // 检查文件大小 (限制5MB)
    if (file.size > 5 * 1024 * 1024) {
      message.error("图片大小不能超过5MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId.toString());

    // 根据接口定义调用上传方法
    const res = await UserControllerService.uploadAvatarUsingPost(
      file, // Blob类型文件
      userId // 用户ID
    );

    if (res.code === 0 && res.data) {
      userAvatarImg.value = res.data;
      if (userInfo.value) {
        userInfo.value.userAvatar = res.data;
      }
      message.success("头像上传成功");
    } else {
      message.error("头像上传失败：" + (res.message || "未知错误"));
    }
  } catch (error: any) {
    message.error("头像上传失败：" + (error.message || "未知错误"));
  }
};

/**
 * 确定修改按钮
 */
// const handleOk2 = async () => {
//   try {
//     const res = await UserControllerService.updateUserUsingPost({
//       ...userInfo.value,
//       userAvatar: userAvatarImg.value,
//     });
//     if (res.code === 0) {
//       message.success("更新成功！");
//       // 更新全局用户信息
//       await store.dispatch("user/getLoginUser");
//       visible2.value = false;
//     } else {
//       message.error("更新失败！" + res.message);
//     }
//   } catch (error: any) {
//     message.error("更新失败：" + error.message);
//   }
// };
/**
 * 确定修改按钮
 */
const handleOk2 = async () => {
  try {
    // 创建更新对象，排除空密码
    const updateData = {
      ...userInfo.value,
      userAvatar: userAvatarImg.value,
    };

    // 如果密码为空，则删除该字段
    if (!updateData.userPassword) {
      delete updateData.userPassword;
    }

    const res = await UserControllerService.updateUserUsingPost(updateData);
    if (res.code === 0) {
      message.success("更新成功！");
      // 更新全局用户信息
      await store.dispatch("user/getLoginUser");
      visible2.value = false;
    } else {
      message.error("更新失败！" + res.message);
    }
  } catch (error: any) {
    message.error("更新失败：" + error.message);
  }
};

const closeModel = () => {
  visible2.value = false;
};
</script>

<style scoped>
.title-bar {
  display: flex;
  flex-direction: column;
  background-color: #2c6545;
}

.title {
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

.user-info-wrapper {
  display: flex;
  justify-content: flex-end;
}

.user-info {
  display: flex;
  align-items: center;
  padding: 4px 17px;
}

.user-name {
  font-size: 14px;
  color: #fff;
  margin-left: 5px;
}
</style>
