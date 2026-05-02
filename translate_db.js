const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bvrammmpcszrqasnxims.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2cmFtbW1wY3N6cnFhc254aW1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzY5MTEyNCwiZXhwIjoyMDkzMjY3MTI0fQ.VbeTCnDyqKEDIdjWHDnMxhFBTuoNB_9bKLyj1_EOq0o';
const supabase = createClient(supabaseUrl, supabaseKey);

const translations = {
  'My House': 'Nhà của tôi',
  'Floor 1': 'Tầng 1',
  'Floor 2': 'Tầng 2',
  'Living Room': 'Phòng Khách',
  'Kitchen': 'Phòng Bếp',
  'Bedroom': 'Phòng Ngủ',
  'North Wall': 'Tường Bắc',
  'South Wall': 'Tường Nam',
  'East Wall': 'Tường Đông',
  'West Wall': 'Tường Tây',
  'Main Door': 'Cửa Chính',
  'Window': 'Cửa Sổ',
  'Sofa': 'Ghế Sofa',
  'TV Stand': 'Kệ TV',
  'TV Cabinet': 'Tủ TV',
  'Remote Control': 'Điều Khiển TV',
  'Door': 'Cửa',
  'Fridge': 'Tủ Lạnh',
  'Stove': 'Bếp Lò',
  'Sink': 'Bồn Rửa',
  'Drawer': 'Ngăn Kéo',
  'Knife': 'Dao',
  'Bed': 'Giường',
  'Desk': 'Bàn Làm Việc',
  'Wardrobe': 'Tủ Quần Áo',
  'Shelf 1': 'Kệ 1',
  'Shelf 2': 'Kệ 2',
  'Box A': 'Hộp A',
  'Scissors': 'Cái Kéo',
  'Watch': 'Đồng Hồ',
  'Glasses': 'Kính Mắt'
};

async function translateDb() {
  const { data, error } = await supabase.from('entities').select('id, name');
  if (error) {
    console.error(error);
    return;
  }
  
  for (const entity of data) {
    if (translations[entity.name]) {
      const { error: updateError } = await supabase
        .from('entities')
        .update({ name: translations[entity.name] })
        .eq('id', entity.id);
      
      if (updateError) {
        console.error(`Failed to update ${entity.name}:`, updateError);
      } else {
        console.log(`Translated ${entity.name} -> ${translations[entity.name]}`);
      }
    }
  }
}

translateDb();
