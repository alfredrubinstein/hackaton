import { jsonDataService } from '../services/jsonDataService';

/**
 * Inicializa datos de ejemplo desde JSONs estáticos
 * Los datos ya están cargados automáticamente por jsonDataService
 * Esta función solo retorna el ID de la primera propiedad
 */
export async function initializeSampleData(): Promise<string> {
  try {
    const properties = await jsonDataService.getProperties();
    if (properties.length > 0) {
      return properties[0].id;
    }
    
    // Si no hay propiedades, los datos se inicializan automáticamente
    // Esperar un momento y volver a intentar
    await new Promise(resolve => setTimeout(resolve, 100));
    const propertiesAfterInit = await jsonDataService.getProperties();
    if (propertiesAfterInit.length > 0) {
      return propertiesAfterInit[0].id;
    }
    
    throw new Error('No se pudieron cargar las propiedades');
  } catch (error) {
    console.error('Error initializing sample data:', error);
    throw error;
  }
}
