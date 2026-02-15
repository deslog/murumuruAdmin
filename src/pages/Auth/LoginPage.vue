<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="title">murumuruAdmin 로그인</h1>

      <form class="form" @submit.prevent="onSubmit">
        <label class="label">
          이메일
          <input
            class="input"
            v-model.trim="email"
            type="email"
            autocomplete="username"
            placeholder="admin@example.com"
            required
          />
        </label>

        <label class="label">
          비밀번호
          <input
            class="input"
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="비밀번호"
            required
          />
        </label>

        <button class="button" type="submit" :disabled="loading">
          {{ loading ? "로그인 중..." : "로그인" }}
        </button>

        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/app/config/firebase";

const router = useRouter();
const email = ref("");
const password = ref("");
const loading = ref(false);
const errorMsg = ref("");

async function onSubmit() {
  errorMsg.value = "";
  loading.value = true;

  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    // ✅ 로그인 성공 - 관리자 페이지로 이동
    router.push("/");
  } catch (err) {
    // 사용자 친화적으로만 간단히
    errorMsg.value = "로그인에 실패했어요. 이메일/비밀번호를 확인해줘.";
    console.error(err);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--bg-secondary, #f5f5f5);
}

.login-card {
  width: 100%;
  max-width: 360px;
  border: 1px solid #eee;
  border-radius: 14px;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.title {
  margin: 0 0 16px;
  font-size: 20px;
  text-align: center;
  color: var(--text-primary, #333);
}

.form {
  display: grid;
  gap: 12px;
}

.label {
  display: grid;
  gap: 6px;
  font-size: 14px;
  color: var(--text-secondary, #666);
}

.input {
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 0 12px;
  font-size: 14px;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary, #3b82f6);
}

.button {
  height: 42px;
  border: 0;
  border-radius: 10px;
  cursor: pointer;
  background: var(--color-primary, #3b82f6);
  color: white;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s;
}

.button:hover:not(:disabled) {
  opacity: 0.9;
}

.button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.error {
  margin: 0;
  color: #c0392b;
  font-size: 13px;
  text-align: center;
}
</style>
