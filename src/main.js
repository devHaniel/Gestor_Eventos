import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'

// Estilos
import 'primeicons/primeicons.css'
import './assets/main.css'

// Componentes PrimeVue comunes
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import DatePicker from 'primevue/datepicker'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import ToggleSwitch from 'primevue/toggleswitch'
import Panel from 'primevue/panel'
import Message from 'primevue/message'
import Avatar from 'primevue/avatar'
import Badge from 'primevue/badge'
import Divider from 'primevue/divider'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Toolbar from 'primevue/toolbar'
import SelectButton from 'primevue/selectbutton'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      prefix: 'p',
      darkModeSelector: 'none', // Forzar modo claro limpio
      cssLayer: false,
    },
  },
})
app.use(ToastService)
app.use(ConfirmationService)

// Registrar componentes de PrimeVue
app.component('DataTable', DataTable)
app.component('Column', Column)
app.component('Dialog', Dialog)
app.component('Select', Select)
app.component('Dropdown', Select) // Compatibilidad
app.component('InputNumber', InputNumber)
app.component('DatePicker', DatePicker)
app.component('Calendar', DatePicker) // Compatibilidad
app.component('Tabs', Tabs)
app.component('TabList', TabList)
app.component('Tab', Tab)
app.component('TabPanels', TabPanels)
app.component('TabPanel', TabPanel)
app.component('Toast', Toast)
app.component('ConfirmDialog', ConfirmDialog)
app.component('Tag', Tag)
app.component('Button', Button)
app.component('InputText', InputText)
app.component('Textarea', Textarea)
app.component('Card', Card)
app.component('Checkbox', Checkbox)
app.component('ToggleSwitch', ToggleSwitch)
app.component('Panel', Panel)
app.component('Message', Message)
app.component('Avatar', Avatar)
app.component('Badge', Badge)
app.component('Divider', Divider)
app.component('IconField', IconField)
app.component('InputIcon', InputIcon)
app.component('Toolbar', Toolbar)
app.component('SelectButton', SelectButton)

app.mount('#app')
