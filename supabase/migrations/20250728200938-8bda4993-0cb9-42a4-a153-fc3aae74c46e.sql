-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create groups table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on groups
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Create group_members table
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level TEXT NOT NULL DEFAULT 'member' CHECK (permission_level IN ('admin', 'member', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS on group_members
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Create bank_accounts table
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  initial_balance DECIMAL(12,2) DEFAULT 0,
  current_balance DECIMAL(12,2) DEFAULT 0,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT check_ownership CHECK (
    (group_id IS NOT NULL AND user_id IS NULL) OR 
    (group_id IS NULL AND user_id IS NOT NULL)
  )
);

-- Enable RLS on bank_accounts
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT,
  category TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for groups
CREATE POLICY "Users can view groups they are members of" 
ON public.groups 
FOR SELECT 
USING (
  auth.uid() = admin_id OR 
  auth.uid() IN (
    SELECT user_id FROM public.group_members 
    WHERE group_id = id
  )
);

CREATE POLICY "Users can create groups" 
ON public.groups 
FOR INSERT 
WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Group admins can update their groups" 
ON public.groups 
FOR UPDATE 
USING (auth.uid() = admin_id);

CREATE POLICY "Group admins can delete their groups" 
ON public.groups 
FOR DELETE 
USING (auth.uid() = admin_id);

-- Create RLS policies for group_members
CREATE POLICY "Users can view group memberships for their groups" 
ON public.group_members 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  auth.uid() IN (
    SELECT admin_id FROM public.groups 
    WHERE id = group_id
  ) OR
  auth.uid() IN (
    SELECT user_id FROM public.group_members gm2 
    WHERE gm2.group_id = group_id
  )
);

CREATE POLICY "Group admins can add members" 
ON public.group_members 
FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT admin_id FROM public.groups 
    WHERE id = group_id
  )
);

CREATE POLICY "Group admins can remove members" 
ON public.group_members 
FOR DELETE 
USING (
  auth.uid() IN (
    SELECT admin_id FROM public.groups 
    WHERE id = group_id
  ) OR auth.uid() = user_id
);

-- Create RLS policies for bank_accounts
CREATE POLICY "Users can view bank accounts they have access to" 
ON public.bank_accounts 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  (group_id IS NOT NULL AND auth.uid() IN (
    SELECT user_id FROM public.group_members 
    WHERE group_id = bank_accounts.group_id
  ))
);

CREATE POLICY "Users can create personal bank accounts" 
ON public.bank_accounts 
FOR INSERT 
WITH CHECK (
  (user_id = auth.uid() AND group_id IS NULL) OR
  (group_id IS NOT NULL AND auth.uid() IN (
    SELECT user_id FROM public.group_members 
    WHERE group_id = bank_accounts.group_id 
    AND permission_level IN ('admin', 'member')
  ))
);

CREATE POLICY "Users can update bank accounts they have access to" 
ON public.bank_accounts 
FOR UPDATE 
USING (
  auth.uid() = user_id OR 
  (group_id IS NOT NULL AND auth.uid() IN (
    SELECT user_id FROM public.group_members 
    WHERE group_id = bank_accounts.group_id 
    AND permission_level IN ('admin', 'member')
  ))
);

-- Create RLS policies for transactions
CREATE POLICY "Users can view transactions for accounts they have access to" 
ON public.transactions 
FOR SELECT 
USING (
  auth.uid() = user_id OR
  auth.uid() IN (
    SELECT ba.user_id FROM public.bank_accounts ba 
    WHERE ba.id = bank_account_id AND ba.user_id = auth.uid()
  ) OR
  auth.uid() IN (
    SELECT gm.user_id FROM public.bank_accounts ba 
    JOIN public.group_members gm ON ba.group_id = gm.group_id 
    WHERE ba.id = bank_account_id AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  (
    auth.uid() IN (
      SELECT ba.user_id FROM public.bank_accounts ba 
      WHERE ba.id = bank_account_id
    ) OR
    auth.uid() IN (
      SELECT gm.user_id FROM public.bank_accounts ba 
      JOIN public.group_members gm ON ba.group_id = gm.group_id 
      WHERE ba.id = bank_account_id AND gm.permission_level IN ('admin', 'member')
    )
  )
);

-- Create trigger to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update bank account balance after transaction
CREATE OR REPLACE FUNCTION public.update_bank_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.bank_accounts 
    SET current_balance = current_balance + 
      CASE 
        WHEN NEW.type = 'income' THEN NEW.amount
        WHEN NEW.type = 'expense' THEN -NEW.amount
      END,
      updated_at = now()
    WHERE id = NEW.bank_account_id;
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    -- Revert old transaction
    UPDATE public.bank_accounts 
    SET current_balance = current_balance - 
      CASE 
        WHEN OLD.type = 'income' THEN OLD.amount
        WHEN OLD.type = 'expense' THEN -OLD.amount
      END
    WHERE id = OLD.bank_account_id;
    
    -- Apply new transaction
    UPDATE public.bank_accounts 
    SET current_balance = current_balance + 
      CASE 
        WHEN NEW.type = 'income' THEN NEW.amount
        WHEN NEW.type = 'expense' THEN -NEW.amount
      END,
      updated_at = now()
    WHERE id = NEW.bank_account_id;
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    UPDATE public.bank_accounts 
    SET current_balance = current_balance - 
      CASE 
        WHEN OLD.type = 'income' THEN OLD.amount
        WHEN OLD.type = 'expense' THEN -OLD.amount
      END,
      updated_at = now()
    WHERE id = OLD.bank_account_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bank_account_balance
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_bank_account_balance();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();