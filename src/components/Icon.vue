<script>
import { ref, h, useSlots } from 'vue'

export default{
  setup() {
    const slots = useSlots();
    return () => h('svg', [
      h('use', {
        'xlink:href': `${window.location.origin}/assets/img/icons/sprite.svg#${slots.default()[0].children}`,
        href: `${window.location.origin}/assets/img/icons/sprite.svg#${slots.default()[0].children}`, innerHTML: slots.default()[0].children
      })
    ])
  }
}
</script>
<style scoped>
svg {
  fill: currentColor;
  width: 24px;
  height: 24px;
  vertical-align: middle;
}
</style>