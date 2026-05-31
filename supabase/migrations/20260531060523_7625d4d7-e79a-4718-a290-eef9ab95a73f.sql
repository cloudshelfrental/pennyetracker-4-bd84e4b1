
CREATE TABLE public.pickup_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  panchayath_id UUID NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pickup_points TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pickup_points TO authenticated;
GRANT ALL ON public.pickup_points TO service_role;

ALTER TABLE public.pickup_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read pickup_points" ON public.pickup_points
  FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated read pickup_points" ON public.pickup_points
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert pickup_points" ON public.pickup_points
  FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins update pickup_points" ON public.pickup_points
  FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins delete pickup_points" ON public.pickup_points
  FOR DELETE TO authenticated USING (is_admin(auth.uid()));

CREATE INDEX idx_pickup_points_panchayath ON public.pickup_points(panchayath_id);

CREATE TRIGGER update_pickup_points_updated_at
  BEFORE UPDATE ON public.pickup_points
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_public_pickup_points()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(g ORDER BY g->>'panchayath_name'), '[]'::jsonb)
  FROM (
    SELECT jsonb_build_object(
      'panchayath_id', p.id,
      'panchayath_name', p.name,
      'points', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', pp.id,
          'name', pp.name,
          'address', pp.address,
          'phone', pp.phone,
          'latitude', pp.latitude,
          'longitude', pp.longitude
        ) ORDER BY pp.name)
        FROM public.pickup_points pp
        WHERE pp.panchayath_id = p.id
      ), '[]'::jsonb)
    ) AS g
    FROM public.panchayaths p
    WHERE EXISTS (SELECT 1 FROM public.pickup_points pp WHERE pp.panchayath_id = p.id)
  ) t;
$$;
