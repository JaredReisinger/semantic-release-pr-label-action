# semantic-release-pr-label-action

![test status](https://github.com/JaredReisinger/semantic-release-pr-label-action/workflows/tests/badge.svg)

Labels PRs based on their semantic-release impact.

> ## <span style="color: red">_**NOTE:** THIS IS NOT YET READY FOR USE._</span>

I am still figuring out how to ensure this will work as a GitHub Action. (That's why there's no useful information in this README.)

## Future thoughts

It might make more sense for this action (or a new one) to _only_ evaluate the semantic-release impact, and send that as output, leaving the labelling/commenting up to other actions. That would simplify this action a lot, and lead towards a better "action building block" design.

Note that because the GITHUB*TOKEN gets read-only access in "PR from a fork" contexts, those PRs \_necessarily cannot* label the PR. If this action (or a new one!) simply generated the semantic-release impact as an output, we defer that issue to another action (like labeler).
