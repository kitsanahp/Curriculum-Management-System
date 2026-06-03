<template>
  <div
    :class="[
      'bg-white border rounded-xl overflow-hidden',
      PADDING_CLASSES[padding],
      ELEVATION_CLASSES[elevation],
      hoverable && 'hover-lift cursor-pointer',
      accentColor && `border-l-4 border-l-${accentColor}-400`
    ]">

    <!-- Header (รับได้ทั้ง slot หรือ props title/subtitle) -->
    <div
      v-if="$slots.header || title"
      :class="[
        'flex items-center justify-between gap-3 border-b border-gray-100',
        HEADER_PADDING[padding]
      ]">
      <slot name="header">
        <div class="flex items-center gap-2.5 min-w-0">
          <component
            v-if="icon"
            :is="icon"
            class="w-4 h-4 text-gray-400 shrink-0"
            aria-hidden="true"
          />
          <div class="min-w-0">
            <h3 class="text-sm font-bold text-gray-900 truncate">{{ title }}</h3>
            <p v-if="subtitle" class="text-xs text-gray-400 mt-0.5 truncate">{{ subtitle }}</p>
          </div>
        </div>
        <slot name="header-action" />
      </slot>
    </div>

    <!-- Body — padding 0 ถ้า no-body-padding (เช่นมี list ใน body) -->
    <div :class="[!noBodyPadding && BODY_PADDING[padding]]">
      <slot />
    </div>

    <!-- Footer -->
    <div
      v-if="$slots.footer"
      :class="[
        'border-t border-gray-100 bg-gray-50/50',
        FOOTER_PADDING[padding]
      ]">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title:    { type: String, default: '' },
  subtitle: { type: String, default: '' },
  icon:     { type: [Object, Function], default: null },
  // none | sm | md | lg
  padding:   { type: String, default: 'md' },
  // none | sm | md
  elevation: { type: String, default: 'sm' },
  // hover-lift effect
  hoverable: { type: Boolean, default: false },
  // ถ้า body มี list/table ที่จัดการ padding เอง
  noBodyPadding: { type: Boolean, default: false },
  // border-l-4 สี เช่น 'orange' | 'red' | 'emerald' (ใช้ tailwind safelist)
  accentColor: { type: String, default: '' },
});

// padding tokens — สม่ำเสมอทั่วระบบ
const PADDING_CLASSES = {
  none: 'border-gray-200',
  sm:   'border-gray-200',
  md:   'border-gray-200',
  lg:   'border-gray-200',
};
const HEADER_PADDING = { none: 'p-0',           sm: 'px-4 py-3',   md: 'px-5 py-3.5', lg: 'px-6 py-4'   };
const BODY_PADDING   = { none: '',              sm: 'p-4',         md: 'p-5',         lg: 'p-6'         };
const FOOTER_PADDING = { none: 'p-0',           sm: 'px-4 py-3',   md: 'px-5 py-3.5', lg: 'px-6 py-4'   };

const ELEVATION_CLASSES = {
  none: '',
  sm:   'shadow-sm',
  md:   'shadow-md',
};
</script>
