import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateKoreaHexGrid } from '../src/utils/geoUtils';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cells = generateKoreaHexGrid(5);

const outputPath = resolve(__dirname, '../src/data/koreaHexGrid.json');
writeFileSync(outputPath, JSON.stringify(cells, null, 2));

console.log(`Generated ${cells.length} hex cells → ${outputPath}`);
