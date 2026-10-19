<script setup lang="ts">
import { getWeaponTypeIconName, getWeaponTypeName } from '~/stores/equipment'

// Official weapon-type glyphs, tinted with currentColor so they sit on any steel.
const props = defineProps<{
  type: string
}>()

const { imageUrl } = useImageUrl()

const iconUrl = computed(() =>
  `url("${imageUrl(`/images/weapon-types/${getWeaponTypeIconName(props.type)}.svg`)}")`
)
</script>

<template>
  <span
    class="icon-mask"
    role="img"
    :aria-label="getWeaponTypeName(type)"
    :style="{ '--icon': iconUrl }"
  />
</template>
