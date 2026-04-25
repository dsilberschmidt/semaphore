# Semaphore in Mina

Prototype for bringing Semaphore-style anonymous signaling to Mina using o1js.

This project explores how privacy-preserving group membership proofs and nullifier-based signaling could be implemented in Mina/zkApps for use cases such as anonymous voting, whistleblowing, and private participation in multi-party applications.

## Context

This repository was developed as a Mina/o1js prototype in the context of:

- Mina Modules / Navigators
- ETHOnline 2024 showcase: https://ethglobal.com/showcase/semaphore-in-mina-u9zpf

It should be understood as a research and prototype repository, not as a production-ready implementation or audited SDK.

## Goal

The main goal of the project was to study how a Semaphore-like system could be adapted to Mina, including:

- anonymous group membership
- proof-based signaling
- nullifier handling to prevent double use
- privacy-preserving application patterns for Mina zkApps

## Motivation

Semaphore is a strong primitive for applications where users need to prove membership in a group without revealing their identity.

Typical examples include:

- anonymous voting
- whistleblowing
- private signaling
- gated participation without public deanonymization
- credential-based interaction without exposing wallet identity

Mina is a particularly interesting setting for this because of its native zero-knowledge orientation and zkApp model.

## Current state

This repository contains an early prototype and exploration work.

What this repo is:
- a technical exploration
- a prototype implementation path
- a basis for discussion and further development

What this repo is not:
- a complete SDK
- an audited implementation
- a finished end-user application
- a drop-in replacement for the official Semaphore stack

## Technical direction

The project explores a Mina-native approach built around:

- o1js / zkApps
- Merkle trees for group membership
- nullifiers to avoid double signaling
- off-chain proof generation with on-chain verification patterns

The general design goal is similar in spirit to Semaphore, but adapted to Mina’s architecture and developer stack.

## Repository structure

Main work is under the `contracts/` directory.

This structure may change as the prototype evolves.

## Related links

- GitHub repository: https://github.com/dsilberschmidt/semaphore
- ETHOnline showcase: https://ethglobal.com/showcase/semaphore-in-mina-u9zpf
- Technical overview: [TECHNICAL_OVERVIEW.md](TECHNICAL_OVERVIEW.md)

## Notes

This repository is being preserved as a meaningful prototype and technical milestone.

If you are interested in privacy-preserving applications on Mina, this repo is best read as an exploratory starting point.
