-- Beta application status enum
CREATE TYPE beta_application_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Beta applications table
CREATE TABLE public.beta_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  status beta_application_status_enum NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_beta_applications_status ON public.beta_applications(status);
CREATE INDEX idx_beta_applications_email ON public.beta_applications(email);

-- RLS
ALTER TABLE public.beta_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can apply (guests have no account)
CREATE POLICY "Anyone can insert beta applications"
  ON public.beta_applications FOR INSERT
  WITH CHECK (true);

-- Admins can read all applications
CREATE POLICY "Admins can read beta applications"
  ON public.beta_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Admins can update application status
CREATE POLICY "Admins can update beta applications"
  ON public.beta_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- updated_at trigger
CREATE TRIGGER beta_applications_updated_at
  BEFORE UPDATE ON public.beta_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
