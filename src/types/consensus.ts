export interface VoteReply {
  id?: number;
  username: string;
  content: string;
  user_level: number;
  created_at: string;
  custom_title?: string;
}

export interface VoteComment {
  id: number;
  username: string;
  real_username?: string | null;
  vote_type: 'agree' | 'disagree' | 'neutral';
  reason: string | null;
  user_level: number;
  updated_at: string;
  is_anonymous: boolean;
  likes: string[];
  replies: VoteReply[];
  is_liked_by_me: boolean;
  is_featured?: boolean;
  custom_title?: string;
}

export interface ConsensusProposal {
  id: number;
  title: string;
  content: string;
  type?: 'standard' | 'discussion';
  created_at: string;
  end_time: string | null;
  min_level: number;
  is_active: boolean;
  stats: {
    agree: number;
    disagree: number;
    total: number;
  };
  my_vote: {
    vote_type: 'agree' | 'disagree' | 'neutral';
    reason: string | null;
    updated_at: string;
    is_anonymous?: boolean;
  } | null;
  recent_votes?: VoteComment[];
}

export interface VotePayload {
  proposal_id: number;
  vote_type: 'agree' | 'disagree' | 'neutral';
  reason: string;
  is_anonymous?: boolean;
}
