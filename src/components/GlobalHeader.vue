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
          <!--登录时 鼠标悬停头像显示个人信息和退出登录，未登录时只显示登录 -->
          <template #content>
            <template
              v-if="loginUser && loginUser.userRole as
string !== ACCESS_ENUM.NOT_LOGIN"
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
  <!-- 对话框 -->
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
        :fileList="file ? [file] : []"
        :show-file-list="false"
        @change="onChange"
        :custom-request="uploadAvatar"
      >
        <template #upload-button>
          <a-avatar :size="80" shape="circle">
            <img alt="头像" :src="userInfo?.userAvatar" />
          </a-avatar>
        </template>
      </a-upload>
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
import { FileItem } from "@arco-design/web-vue";

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

// 退出登录
const logout = async () => {
  try {
    // 1. 调用后端登出接口
    await UserControllerService.userLogoutUsingPost();

    // 2. 清除前端用户状态
    store.commit("user/setLoginUser", {
      userName: "未登录",
      userRole: ACCESS_ENUM.NOT_LOGIN,
      userAvatar: "",
    });

    // 3. 清除本地存储（根据实际存储方式调整）
    localStorage.removeItem("token");
    sessionStorage.clear();

    // 4. 跳转到登录页并刷新
    router.push("/user/login").then(() => {
      location.reload(); // 确保完全重置状态
    });
  } catch (error) {
    message.error("退出登录失败");
  }
};
// 默认主页
const selectedKeys = ref(["/"]);

// 新增：窗口宽度和折叠状态
const windowWidth = ref(window.innerWidth);
const collapseThreshold = 1000; // 根据实际调整阈值
const isCollapsed = ref(false);
const loginUser = store.state.user.loginUser;
const userAvatar = loginUser.userAvatar;

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
// 弹窗
const visible2 = ref(false);
const userInfo = ref<User>();
const openModalForm = async (userId: any) => {
  const res = await UserControllerService.getUserByIdUsingGet(userId);
  userInfo.value = res.data;
  visible2.value = true;
};
/**
 * 确定修改按钮
 */
// 从表单中获取的用户头像
let userAvatarImg = userInfo.value?.userAvatar;
const handleOk2 = async () => {
  const res = await UserControllerService.updateUserUsingPost({
    ...userInfo.value,
    userAvatar: userAvatarImg,
  });
  if (res.code === 0) {
    message.success("更新成功！");
    visible2.value = false;
    location.reload();
  } else {
    message.error("更新失败！", res.msg);
  }
};
const closeModel = () => {
  visible2.value = false;
};
const file = ref();
const onChange = async (_: never, currentFile: FileItem) => {
  file.value = {
    ...currentFile,
  };
};
//上传头像
/**
 * 上传头像
 */
const uploadAvatar = async () => {
  const res = await FileControllerService.uploadFileUsingPost(file?.value.file);
  console.log(res);
  if (res.code === 0) {
    userAvatarImg = res.data;
    message.success("上传成功，点击确认即可修改头像");
  } else {
    message.error("上传失败！" + res.data);
  }
};
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

.user-info-wrapper {
  display: flex;
  justify-content: flex-end;
}

.user-info {
  display: flex; /* 使用 Flexbox 布局 */
  align-items: center; /* 垂直居中 */
  padding: 4px 17px;
}

#user-avatar {
  margin-right: 5px; /* 头像和名称之间的间距 */
}

.user-name {
  font-size: 14px; /* 调整字体大小 */
  color: #fff; /* 设置字体颜色为白色以适应背景 */
  margin-left: 5px; /* 名称和头像之间的间距 */
}
</style>
