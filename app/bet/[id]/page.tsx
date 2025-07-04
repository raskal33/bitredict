"use client";

import { useAccount } from "wagmi";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Pool, Comment } from "@/lib/types";

export default function BetPage() {
  const { address } = useAccount();
  const params = useParams();
  const poolId = params.id as string;
  
  const [betAmount, setBetAmount] = useState<string>("10");
  const [betSide, setBetSide] = useState<"yes" | "no" | null>(null);
  const [loading, setLoading] = useState(true);
  const [pool, setPool] = useState<Pool | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);

  const fetchPoolData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pools/${poolId}`);
      const data = await response.json();
      setPool(data.data);
      setComments(data.data.comments || []);
    } catch (error) {
      console.error('Error fetching pool data:', error);
    } finally {
      setLoading(false);
    }
  }, [poolId]);

  useEffect(() => {
    fetchPoolData();
  }, [fetchPoolData]);

  const handleBet = async () => { 
    if(!betSide || !betAmount) return;
    console.log(address, poolId, betSide, betAmount);
   };

  const renderComment = (comment: Comment): JSX.Element => {
    return (
      <div key={comment.id}>
        <p>{comment.author.username}: {comment.content}</p>
      </div>
    );
  };

  if (loading) return <div>Loading...</div>;
  if (!pool) return <div>Pool not found.</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">{pool.title}</h1>
      <p>{pool.description}</p>
      
      <div className="my-4">
        <button onClick={() => setBetSide("yes")} className="bg-green-500 p-2">Bet Yes</button>
        <button onClick={() => setBetSide("no")} className="bg-red-500 p-2">Bet No</button>
        <input type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} className="text-black" />
        <button onClick={handleBet} className="bg-blue-500 p-2">Submit Bet</button>
      </div>

      <div>
        <h2 className="text-xl font-bold">Comments</h2>
        <div className="space-y-2">
          {comments.map(renderComment)}
        </div>
      </div>
    </div>
  );
}
