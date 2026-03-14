-- Storage bucket for plant images
insert into storage.buckets (id, name, public)
values ('plant-images', 'plant-images', true)
on conflict (id) do nothing;

-- Storage policies
create policy "Users can upload own plant images" on storage.objects
  for insert with check (
    bucket_id = 'plant-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Plant images are publicly viewable" on storage.objects
  for select using (bucket_id = 'plant-images');

create policy "Users can delete own plant images" on storage.objects
  for delete using (
    bucket_id = 'plant-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
