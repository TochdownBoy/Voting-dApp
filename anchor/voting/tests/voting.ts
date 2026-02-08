import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Voting } from "../target/types/voting";
import { PublicKey } from "@solana/web3.js";
import { startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { assert } from "chai";

const IDL = require("../target/idl/voting.json");

const votingAddress = new PublicKey("8gYP5MjjMfZzriFysNoN1zo5My7xWE8pA4wwrYdscNUp");

describe("voting", () => {
    let context;
    let provider;
    let votingProgram: Program<Voting>;
    const pollId = new anchor.BN(1);

    beforeEach(async () => {
        context = await startAnchor("", [{ name: "voting", programId: votingAddress, },], []);
        provider = new BankrunProvider(context);
        votingProgram = new Program<Voting>(IDL, provider);
    });

    it("Initialize Poll", async () => {
        const startTime = new anchor.BN(0);
        const endTime = new anchor.BN(1870558415);

        await votingProgram.methods
            .initializePoll(
                pollId,
                startTime,
                endTime,
                "What is your favorite programming language?",
                "Share your preference on programming languages"
            )
            .rpc();

        const [pollAddress] = PublicKey.findProgramAddressSync(
            [Buffer.from("poll"), pollId.toArrayLike(Buffer, "le", 8)],
            votingAddress
        );

        const poll = await votingProgram.account.pollAccount.fetch(pollAddress);

        console.log(poll);

        assert.strictEqual(
            poll.pollName,
            "What is your favorite programming language?"
        );
        assert.strictEqual(
            poll.pollDescription,
            "Share your preference on programming languages"
        );
        assert.ok(poll.pollVotingStart.eq(startTime));
        assert.ok(poll.pollVotingEnd.eq(endTime));
        assert.ok(poll.pollOptionIndex.eq(new anchor.BN(0)));
    });

    it("Initialize Candidate", async () => {
        const candidateName = "Rust";

        await votingProgram.methods
            .initializePoll(
                pollId,
                new anchor.BN(0),
                new anchor.BN(1870558415),
                "What is your favorite programming language?",
                "Share your preference on programming languages"
            )
            .rpc();

        const [pollAddress] = PublicKey.findProgramAddressSync(
            [Buffer.from("poll"), pollId.toArrayLike(Buffer, "le", 8)],
            votingAddress
        );

        const [candidateAddress] = PublicKey.findProgramAddressSync(
            [pollId.toArrayLike(Buffer, "le", 8), Buffer.from(candidateName)],
            votingAddress
        );

        await votingProgram.methods
            .initializeCandidate(pollId, candidateName)
            .accountsPartial({
                signer: provider.wallet.publicKey,
                pollAccount: pollAddress,
                candidateAccount: candidateAddress,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();

        const candidate = await votingProgram.account.candidateAccount.fetch(candidateAddress);
        const poll = await votingProgram.account.pollAccount.fetch(pollAddress);

        console.log("Candidate:", candidate);
        console.log("Poll option index:", poll.pollOptionIndex.toString());

        assert.strictEqual(candidate.candidateName, candidateName);
        assert.ok(candidate.candidateVotes.eq(new anchor.BN(0)));
        assert.ok(poll.pollOptionIndex.eq(new anchor.BN(1)));
    });

    it("Vote", async () => {
        const candidateName = "TypeScript";
        const currentTime = Math.floor(Date.now() / 1000);
        const startTime = new anchor.BN(currentTime - 100);
        const endTime = new anchor.BN(currentTime + 1000);

        await votingProgram.methods
            .initializePoll(
                pollId,
                startTime,
                endTime,
                "What is your favorite programming language?",
                "Share your preference on programming languages"
            )
            .rpc();

        const [pollAddress] = PublicKey.findProgramAddressSync(
            [Buffer.from("poll"), pollId.toArrayLike(Buffer, "le", 8)],
            votingAddress
        );

        const [candidateAddress] = PublicKey.findProgramAddressSync(
            [pollId.toArrayLike(Buffer, "le", 8), Buffer.from(candidateName)],
            votingAddress
        );


        await votingProgram.methods
            .initializeCandidate(pollId, candidateName)
            .accountsPartial({
                signer: provider.wallet.publicKey,
                pollAccount: pollAddress,
                candidateAccount: candidateAddress,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();


        await votingProgram.methods
            .vote(pollId, candidateName)
            .accountsPartial({
                signer: provider.wallet.publicKey,
                pollAccount: pollAddress,
                candidateAccount: candidateAddress,
            })
            .rpc();

        const candidate = await votingProgram.account.candidateAccount.fetch(candidateAddress);

        console.log("Candidate votes:", candidate.candidateVotes.toString());

        assert.ok(candidate.candidateVotes.eq(new anchor.BN(1)));


        await votingProgram.methods
            .vote(pollId, candidateName)
            .accountsPartial({
                signer: provider.wallet.publicKey,
                pollAccount: pollAddress,
                candidateAccount: candidateAddress,
            })
            .rpc();

        const candidateAfterSecondVote = await votingProgram.account.candidateAccount.fetch(candidateAddress);

        console.log("Candidate votes after second vote:", candidateAfterSecondVote.candidateVotes.toString());

        assert.ok(candidateAfterSecondVote.candidateVotes.eq(new anchor.BN(2)));
    });
});