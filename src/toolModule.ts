import { defineKonitifToolModule } from '@konitif/tools';

export const timelineToolModule = defineKonitifToolModule({
  id: 'konitif.timeline',
  name: 'KONITIF Timeline',
  capability: 'temporal-projection',
  description: 'Headless temporal projection composed from explicit track contributions.'
});
