-- Fix the recursive policy in group_members table
DROP POLICY IF EXISTS "Users can view group memberships for their groups" ON public.group_members;

CREATE POLICY "Users can view group memberships for their groups" 
ON public.group_members 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR auth.uid() IN (
    SELECT groups.admin_id 
    FROM groups 
    WHERE groups.id = group_members.group_id
  )
);

-- Simplify bank accounts policies to avoid complex joins that might cause recursion
DROP POLICY IF EXISTS "Users can view bank accounts they have access to" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can update bank accounts they have access to" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can create personal bank accounts" ON public.bank_accounts;

CREATE POLICY "Users can view their own bank accounts" 
ON public.bank_accounts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bank accounts" 
ON public.bank_accounts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND group_id IS NULL);

CREATE POLICY "Users can update their own bank accounts" 
ON public.bank_accounts 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Simplify transactions policies
DROP POLICY IF EXISTS "Users can view transactions for accounts they have access to" ON public.transactions;
DROP POLICY IF EXISTS "Users can create transactions" ON public.transactions;

CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND auth.uid() IN (
    SELECT ba.user_id 
    FROM bank_accounts ba 
    WHERE ba.id = transactions.bank_account_id
  )
);

CREATE POLICY "Users can update their own transactions" 
ON public.transactions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" 
ON public.transactions 
FOR DELETE 
USING (auth.uid() = user_id);