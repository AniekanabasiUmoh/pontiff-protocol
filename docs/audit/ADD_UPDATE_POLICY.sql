-- Add policy to allow authenticated users to update tournament brackets
-- This is secure because it only allows authenticated API requests

CREATE POLICY "Authenticated users can update tournament_brackets"
ON tournament_brackets
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Verify the new policy
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'tournament_brackets'
ORDER BY policyname;
