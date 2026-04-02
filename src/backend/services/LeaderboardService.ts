import type { LeaderboardRepository } from "../repositories/types";

export class LeaderboardService {
  private readonly leaderboardRepository: LeaderboardRepository;

  constructor(leaderboardRepository: LeaderboardRepository) {
    this.leaderboardRepository = leaderboardRepository;
  }

  async listRanked(page: number): Promise<{
    page: number;
    pageCount: number;
    players: Array<{
      playerID: string;
      elo: number;
      wins: number;
      losses: number;
    }>;
  }> {
    return this.leaderboardRepository.listRanked(page, 50);
  }
}
