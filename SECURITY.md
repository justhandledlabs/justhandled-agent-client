# Security policy

Do not report vulnerabilities through public issues when they include secrets, wallet material, exploitable payment details, or customer data. Contact the maintainer privately through the security contact published on the eventual GitHub repository.

The client must never broaden its pinned payment terms without a major-version review. Tests should continue to prove that mismatched gateway origins, networks, assets, amounts, and receivers fail before signing.

Never commit wallet keys, seed phrases, CDP credentials, npm tokens, or `.env` files.
