<script setup>
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
    <router-view />
    <Toast position="top-right" />
    <ConfirmDialog />
  </div>
</template>
