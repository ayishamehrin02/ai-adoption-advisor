import education from '../../config/sectors/education.json';
import finance from '../../config/sectors/finance.json';
import healthcare from '../../config/sectors/healthcare.json';
import hospitality from '../../config/sectors/hospitality.json';
import it from '../../config/sectors/it-services.json';
import logistics from '../../config/sectors/logistics.json';
import manufacturing from '../../config/sectors/manufacturing.json';
import retail from '../../config/sectors/retail-ecommerce.json';

export const sectors = [it, healthcare, finance, education, retail, logistics, manufacturing, hospitality];
export function getSector(id: string) { return sectors.find(s => s.id === id); }
