import { PresetArtwork } from '../types';

export const PRESET_ARTWORKS: PresetArtwork[] = [
  {
    id: 'starry-night',
    title: 'Yıldızlı Gece (Vincent van Gogh)',
    artist: 'Vincent van Gogh',
    category: 'Ünlü Sanat Eseri',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1000&q=80',
    defaultWidthCm: 150,
    defaultHeightCm: 120,
    defaultTileSizeMm: 15,
    defaultColors: 12,
    description: 'Dramatik mavi, sarı ve lacivert tonlarının sarmal mozaik taşlarıyla işlenmesine uygun klasik başyapıt.'
  },
  {
    id: 'turkish-tile',
    title: 'Geleneksel İznik Çini Motif (Lale)',
    artist: 'Osmanlı Sanatı',
    category: 'Geleneksel & Çini',
    imageUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1000&q=80',
    defaultWidthCm: 100,
    defaultHeightCm: 100,
    defaultTileSizeMm: 10,
    defaultColors: 8,
    description: 'Klasik Turkuaz, Mercan Kırmızı ve Kobalt Mavi tonlarında İznik çini motifli mozaik panosu.'
  },
  {
    id: 'roman-mosaic',
    title: 'Antik Roma Desen ve Geometrik Bordo',
    artist: 'Antik Mozaik Ustaları',
    category: 'Antik Mozaik',
    imageUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=1000&q=80',
    defaultWidthCm: 120,
    defaultHeightCm: 120,
    defaultTileSizeMm: 20,
    defaultColors: 6,
    description: 'Doğal mermer taşlar (traverten, siyah, terracotta) ile antik Roma villaları tarzı taban/duvar mozaik deseni.'
  },
  {
    id: 'abstract-sunset',
    title: 'Modern Soyut Geometrik Gün Batımı',
    artist: 'Modern Sanat',
    category: 'Modern & Geometrik',
    imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1000&q=80',
    defaultWidthCm: 180,
    defaultHeightCm: 100,
    defaultTileSizeMm: 20,
    defaultColors: 10,
    description: 'Sıcak turuncu, somon, sarı ve derin mor tonların çağdaş mimari için mozaik uyarlaması.'
  },
  {
    id: 'mediterranean-fish',
    title: 'Akdeniz Deniz Motifi & Balık',
    artist: 'Ege & Akdeniz Sanatı',
    category: 'Deniz & Doğa',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    defaultWidthCm: 120,
    defaultHeightCm: 80,
    defaultTileSizeMm: 15,
    defaultColors: 8,
    description: 'Havuz kenarı ve ıslak hacimler için ideal cam mozaik tonlarında deniz temalı pano.'
  }
];
