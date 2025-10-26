-- Row Level Security Policies for Team Boards
-- Run this in Supabase SQL Editor to enable team board access

-- Team boards policies
CREATE POLICY "Team members can view their team board" ON team_boards FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_members.pursuit_id = team_boards.pursuit_id 
    AND team_members.user_id = auth.uid()
  )
);

CREATE POLICY "Team members can create team board" ON team_boards FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_members.pursuit_id = pursuit_id 
    AND team_members.user_id = auth.uid()
  )
);

-- Board tasks policies
CREATE POLICY "Team members can view board tasks" ON board_tasks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM team_boards
    JOIN team_members ON team_members.pursuit_id = team_boards.pursuit_id
    WHERE team_boards.id = board_tasks.board_id
    AND team_members.user_id = auth.uid()
  )
);

CREATE POLICY "Team members can create tasks" ON board_tasks FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_boards
    JOIN team_members ON team_members.pursuit_id = team_boards.pursuit_id
    WHERE team_boards.id = board_id
    AND team_members.user_id = auth.uid()
  )
);

CREATE POLICY "Team members can update tasks" ON board_tasks FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM team_boards
    JOIN team_members ON team_members.pursuit_id = team_boards.pursuit_id
    WHERE team_boards.id = board_tasks.board_id
    AND team_members.user_id = auth.uid()
  )
);

CREATE POLICY "Team members can delete tasks" ON board_tasks FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM team_boards
    JOIN team_members ON team_members.pursuit_id = team_boards.pursuit_id
    WHERE team_boards.id = board_tasks.board_id
    AND team_members.user_id = auth.uid()
  )
);
