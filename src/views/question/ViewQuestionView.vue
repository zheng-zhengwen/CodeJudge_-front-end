<template>
  <div id="viewQuestionView">
    <a-row :gutter="[24, 24]">
      <a-col :md="12" :xs="24">
        <a-tabs default-active-key="question">
          <a-tab-pane key="question" title="题目">
            <a-card v-if="question" :title="question.title">
              <a-descriptions
                title="判题条件"
                :column="{ xs: 1, md: 2, lg: 3 }"
              >
                <a-descriptions-item label="时间限制">
                  {{ question.judgeConfig?.timeLimit ?? 0 }}
                </a-descriptions-item>
                <a-descriptions-item label="内存限制">
                  {{ question.judgeConfig?.memoryLimit ?? 0 }}
                </a-descriptions-item>
                <a-descriptions-item label="堆栈限制">
                  {{ question.judgeConfig?.stackLimit ?? 0 }}
                </a-descriptions-item>
              </a-descriptions>
              <MdViewer :value="question.content || ''" />
              <template #extra>
                <a-space wrap>
                  <a-tag
                    v-for="(tag, index) of question.tags"
                    :key="index"
                    color="green"
                    >{{ tag }}
                  </a-tag>
                </a-space>
              </template>
            </a-card>
          </a-tab-pane>
          <!--          <a-tab-pane key="comment" title="评论" disabled> 评论区</a-tab-pane>-->
          <a-tab-pane key="answer" title="答案">
            <!-- 添加加载状态和空值检查 -->
            <!-- 如果 loading 为 true，说明数据正在加载中，显示加载图标 -->
            <template v-if="loading">
              <a-spin />
            </template>
            <!-- 如果 loading 为 false，且 question 存在并且 question.answer 也存在，渲染 MdViewer 组件 -->
            <template v-else-if="question && question.answer">
              <MdViewer :value="question.answer" />
            </template>
            <!-- 如果以上条件都不满足，即数据加载完成但没有答案，显示占位提示 -->
            <template v-else>
              <a-empty description="暂无答案" />
            </template>
          </a-tab-pane>
          <a-tab-pane key="ai" title="AI 答题">
            <a-card v-if="question" :title="`题目：${question.title}`">
              <template #extra>
                <a-button
                  type="primary"
                  @click="handleAiSubmit(form.language)"
                  :loading="aiLoading"
                >
                  AI 解答
                </a-button>
              </template>
              <div v-if="aiResult">
                <a-typography-title :heading="6"
                  >AI 解答结果：
                </a-typography-title>
                <a-divider />
                <MdViewer :value="aiResult.result || ''" disabled="disabled" />
                <template v-if="aiResult.code">
                  <a-typography-title :heading="6"
                    >示例代码：
                  </a-typography-title>
                  <CodeEditor
                    :value="aiResult.code"
                    :language="form.language"
                    :readonly="true"
                  />
                </template>
              </div>
              <a-empty v-else description="点击 AI 解答获取答案" />
            </a-card>
          </a-tab-pane>
        </a-tabs>
      </a-col>
      <a-col :md="12" :xs="24">
        <a-form :model="form" layout="inline">
          <a-form-item
            field="language"
            label="编程语言"
            style="min-width: 140px"
          >
            <a-select
              :style="{ width: '320px' }"
              placeholder="请选择编程语言"
              v-model="form.language"
            >
              <a-option>java</a-option>
              <a-option>cpp</a-option>
              <a-option>go</a-option>
            </a-select>
          </a-form-item>
          <a-button
            type="primary"
            style="min-width: 140px"
            status="success"
            @click="doSubmit"
            >提交代码
          </a-button>
        </a-form>
        <CodeEditor
          :key="form.language"
          :value="form.code as string"
          :language="form.language"
          :handle-change="changeCode"
        />
        <a-divider size="0"></a-divider>
      </a-col>
    </a-row>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref, withDefaults, defineProps, watch } from "vue";
import {
  AiQuestionVO,
  Question,
  QuestionControllerService,
  QuestionSubmitAddRequest,
  QuestionVO,
} from "../../../generated";
import { Message } from "@arco-design/web-vue";
import CodeEditor from "@/components/CodeEditor.vue";
import MdViewer from "@/components/MdViewer.vue";
import message from "@arco-design/web-vue/es/message";
import { eventBus, EventType } from "@/utils/eventBus";

interface Props {
  id: string;
}

const props = withDefaults(defineProps<Props>(), {
  id: () => "",
});

const question = ref<QuestionVO>();
// 添加加载状态，初始化为 true，表示数据正在加载
const loading = ref(true);

const loadData = async () => {
  try {
    const res = await QuestionControllerService.getQuestionVoByIdUsingGet(
      props.id as any
    );
    if (res.code === 0) {
      question.value = res.data;
    } else {
      Message.error("加载失败" + res.message);
    }
  } catch (error) {
    // 捕获可能的错误，比如网络请求失败，显示错误提示
    Message.error("加载失败");
  } finally {
    // 无论数据加载成功或失败，都将 loading 设置为 false，表示加载结束
    loading.value = false;
  }
};

const LANGUAGE_TEMPLATES = {
  java: `public class Main {
    public static void main(String[] args) {
        // 在这里写下你的代码
        int num1 = Integer.parseInt(args[0]);
        int num2 = Integer.parseInt(args[1]);
        // 进行加法运算
        int sum = num1 + num2;
        // 输出结果
        System.out.println(sum);
    }
}`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    // 在这里写下你的代码
    cout << "Hello World!" << endl;
    return 0;
}`,
  go: `package main

import "fmt"

func main() {
    // 在这里写下你的代码
    fmt.Println("Hello World!")
}`,
};

const form = ref<QuestionSubmitAddRequest>({
  language: "java",
  code: LANGUAGE_TEMPLATES.java,
});

watch(
  () => form.value.language,
  (newLanguage) => {
    const template =
      LANGUAGE_TEMPLATES[newLanguage as keyof typeof LANGUAGE_TEMPLATES];
    if (template !== undefined) form.value.code = template;
  }
);

/**
 * 提交代码
 * */
const doSubmit = async () => {
  if (!question.value?.id) {
    return;
  }
  const res = await QuestionControllerService.doQuestionSubmitUsingPost({
    ...form.value,
    /**
     * 提交失败，需要给题目ID
     * */
    questionId: question.value.id,
  });
  if (res.code === 0) {
    message.success("提交成功");
    eventBus.emit(EventType.REFRESH_SUBMITS);
  } else {
    message.error("提交失败" + res.message);
  }
};
/**
 * 页加载时请求数据
 * */
onMounted(() => {
  loadData();
});

/**
 * 监听输入
 * */
const changeCode = (value: string) => {
  // console.log("changeCode", value);
  form.value.code = value;
};

/**
 AI 相关状态
 **/
const aiLoading = ref(false);
const aiResult = ref<AiQuestionVO>();

/**
 * 处理 AI 解答
 */
const handleAiSubmit = async (language: string) => {
  if (!question.value?.id) {
    Message.error("题目不存在");
    return;
  }

  try {
    aiLoading.value = true;
    const res = await QuestionControllerService.aiQuestionUsingPost({
      questionId: question.value.id,
      language: language,
    });

    if (res.code === 0 && res.data) {
      aiResult.value = res.data;
      Message.success("AI 解答成功");
    } else {
      Message.error("AI 解答失败：" + (res.message || "未知错误"));
    }
  } catch (error: any) {
    Message.error("AI 解答失败：" + (error.message || "未知错误"));
  } finally {
    aiLoading.value = false;
  }
};
</script>

<style>
#viewQuestionView {
  max-width: 1400px;
  margin: 0 auto;
}

#viewQuestionView .arco-space-horizontal .arco-space-item {
  margin-bottom: 0 !important;
}
</style>
