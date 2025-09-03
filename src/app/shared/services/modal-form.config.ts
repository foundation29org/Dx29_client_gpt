import { ModalFormConfig } from '../components/unified-modal-form.component';

export const MODAL_FORM_CONFIGS: Record<string, ModalFormConfig> = {
  contact: {
    title: 'Contacto',
    description: 'Contáctanos para resolver tus dudas o consultas.',
    messagePlaceholder: 'Escribe tu mensaje aquí...',
    submitButtonText: 'Enviar',
    type: 'contact',
    showMessage: true,
    showTerms: true,
    showSubscribeCheckbox: true
  },
  
  subscribe: {
    title: 'Recibir actualizaciones',
    description: 'Suscríbete para recibir actualizaciones sobre nuevas funcionalidades, casos de éxito y avances en diagnóstico médico asistido por IA.',
    messagePlaceholder: '',
    submitButtonText: 'Suscribirme',
    type: 'subscribe',
    showMessage: false,
    showTerms: true,
    showSubscribeCheckbox: false
  },
  
  clinicalData: {
    title: 'Donar datos clínicos individuales',
    description: 'Ayúdanos a mejorar el diagnóstico de enfermedades compartiendo datos clínicos anónimos. Para proceder con la donación de datos clínicos, completa el siguiente formulario y nuestro equipo se pondrá en contacto contigo para coordinar el proceso de manera segura.',
    messagePlaceholder: 'Describe los datos clínicos que deseas donar (tipo de datos, cantidad aproximada, formato, etc.)',
    submitButtonText: 'Enviar solicitud',
    type: 'clinical-data',
    showMessage: true,
    showTerms: false,
    showSubscribeCheckbox: true
  },
  
  datasets: {
    title: 'Donar datasets (instituciones/investigación)',
    description: 'Comparte datasets institucionales para mejorar el diagnóstico de enfermedades. Para proceder con la donación de datasets, completa el siguiente formulario y nuestro equipo se pondrá en contacto contigo para coordinar el proceso de manera segura.',
    messagePlaceholder: 'Describe los datasets que deseas donar (tipo de datos, tamaño, formato, institución, etc.)',
    submitButtonText: 'Enviar solicitud',
    type: 'datasets',
    showMessage: true,
    showTerms: false,
    showSubscribeCheckbox: true
  }
};