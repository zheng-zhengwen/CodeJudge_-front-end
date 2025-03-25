<template>
  <div id="manageQuestionView">
    <h2 class="question-title">题目管理</h2>
    <a-table
      :columns="columns"
      :data="dataList"
      :pagination="{
        pageSize: searchParams.pageSize,
        current: searchParams.pageNum,
        showTotal: true,
      }"
    >
      <template #optional="{ record }">
        <a-space>
          <a-button type="primary" @click="doUpdate(record)">修改</a-button>
          <a-button status="danger" @click="doDelete(record)">删除</a-button>
        </a-space>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Question, QuestionControllerService } from "../../../generated";
import { Message } from "@arco-design/web-vue";
import { useRouter } from "vue-router";

const dataList = ref([]);
const total = ref(0);
const searchParams = ref({
  pageSize: 10,
  pageNum: 1,
});
const loadData = async () => {
  const res = await QuestionControllerService.listQuestionByPageUsingPost(
    searchParams.value
  );
  if (res.code === 0) {
    dataList.value = res.data.records;
  } else {
    Message.error("加载失败" + res.message);
  }
};
const show = ref(true);
//页面加载时请求对应数据
onMounted(() => {
  loadData();
});

//{id: "1903714813854654465", title: "A + B", content: "题目内容", tags: "["栈","简单"]", answer: "暴破",…}
const columns = [
  {
    title: "id",
    dataIndex: "id",
  },
  {
    title: "标题",
    dataIndex: "title",
  },
  {
    title: "内容",
    dataIndex: "content",
  },
  {
    title: "标签",
    dataIndex: "tags",
  },
  {
    title: "答案",
    dataIndex: "answer",
  },
  {
    title: "提交数",
    dataIndex: "submitNum",
  },
  {
    title: "通过数",
    dataIndex: "acceptedNum",
  },
  {
    title: "判题配置",
    dataIndex: "judgeConfig",
  },
  {
    title: "判题用例",
    dataIndex: "judgeCase",
  },

  {
    title: "用户ID",
    dataIndex: "userId",
  },
  {
    title: "创建时间",
    dataIndex: "createTime",
  },
  {
    title: "操作",
    slotName: "optional",
  },
];
const doDelete = async (question: Question) => {
  const res = await QuestionControllerService.deleteQuestionUsingPost({
    id: question.id,
  });
  if (res.code === 0) {
    dataList.value = res.data.records;
    total.value = res.data.total;
    Message.success("删除成功");
    //自动更新表格中的数据
    loadData();
  } else {
    Message.error("操作失败" + res.message);
  }
};

const router = useRouter();
const doUpdate = (question: Question) => {
  // console.log(question);
  router.push({
    path: "/update/question",
    query: {
      id: question.id,
    },
  });
};
</script>

<style scoped>
#manageQuestionView {
}

.question-title {
  color: #2c6545;
  font-size: 28px;
  border-bottom: 3px solid #2c6545;
  padding-bottom: 12px;
  margin-bottom: 32px;
}
</style>
