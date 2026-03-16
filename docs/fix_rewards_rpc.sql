-- Ensure rewards table exists and has correct columns
CREATE TABLE IF NOT EXISTS public.rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    avatar_level INTEGER DEFAULT 1,
    last_earned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS on rewards
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own rewards
DROP POLICY IF EXISTS "Users can view own rewards" ON public.rewards;
CREATE POLICY "Users can view own rewards" ON public.rewards
    FOR SELECT USING (auth.uid() = user_id);

-- RPC to add points safely
CREATE OR REPLACE FUNCTION add_points(activity_type TEXT)
RETURNS JSON AS $$
DECLARE
    points_to_add INTEGER := 0;
    current_points INTEGER;
    new_points INTEGER;
    new_level INTEGER;
    user_uuid UUID;
BEGIN
    user_uuid := auth.uid();
    IF user_uuid IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Not authenticated');
    END IF;

    -- Determine points based on type or direct value
    IF activity_type = 'mood' THEN points_to_add := 5;
    ELSIF activity_type = 'focus' THEN points_to_add := 20;
    ELSIF activity_type = 'approval' THEN points_to_add := 10;
    -- Handle numeric strings (legacy/direct call)
    ELSIF activity_type ~ '^[0-9]+$' THEN points_to_add := activity_type::INTEGER;
    ELSE points_to_add := 0;
    END IF;

    IF points_to_add = 0 THEN
        RETURN json_build_object('success', false, 'message', 'Invalid activity type or zero points');
    END IF;

    -- Update or Insert rewards record
    INSERT INTO public.rewards (user_id, total_points, avatar_level)
    VALUES (user_uuid, points_to_add, 1)
    ON CONFLICT (user_id) DO UPDATE
    SET 
        total_points = rewards.total_points + points_to_add,
        last_earned_at = now()
    RETURNING total_points INTO new_points;

    -- Calculate level (Simplified formula: Level 1 @ 0, Level 2 @ 50, Level 3 @ 150, etc.)
    -- Match rewards.js logic: [Beginner=0, Newbie=50, Emerge=150, Enthusiast=350, Advance=600, Absolute=1000, Experienced=1500]
    IF new_points < 50 THEN new_level := 1;
    ELSIF new_points < 150 THEN new_level := 2;
    ELSIF new_points < 350 THEN new_level := 3;
    ELSIF new_points < 600 THEN new_level := 4;
    ELSIF new_points < 1000 THEN new_level := 5;
    ELSIF new_points < 1500 THEN new_level := 6;
    ELSE new_level := 7; -- Capped at level 7
    END IF;

    UPDATE public.rewards SET avatar_level = new_level WHERE user_id = user_uuid;

    RETURN json_build_object(
        'success', true, 
        'points_added', points_to_add, 
        'total_points', new_points,
        'level', new_level
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
