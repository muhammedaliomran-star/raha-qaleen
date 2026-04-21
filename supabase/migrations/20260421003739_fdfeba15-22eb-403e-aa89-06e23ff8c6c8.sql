-- Create storage bucket for ad images
INSERT INTO storage.buckets (id, name, public)
VALUES ('ads', 'ads', true)
ON CONFLICT (id) DO NOTHING;

-- Public can view ad images
CREATE POLICY "Ad images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'ads');

-- Only admins can upload/update/delete ad images
CREATE POLICY "Admins can upload ad images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ads' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ad images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'ads' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ad images"
ON storage.objects FOR DELETE
USING (bucket_id = 'ads' AND has_role(auth.uid(), 'admin'::app_role));