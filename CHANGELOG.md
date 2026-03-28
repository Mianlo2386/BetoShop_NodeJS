# Changelog

## [1.2.0](https://github.com/Mianlo2386/BetoShop_NodeJS/compare/v1.1.0...v1.2.0) (2026-03-27)


### Features

* add maintenance mode to login and register pages ([599a19c](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/599a19c39ec14c191d53b37a90d67aad854a80be))
* add size button and fix contact email ([1f0bb7b](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/1f0bb7b04a9c2cc272275f8f4663bcaefdb43169))
* fix shop-single.html to load products from API ([580d101](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/580d101e4184cb779eb26f6a2dc23ca554cbee9c))
* integrate maintenance-mode.js to frontend pages ([ec77a18](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/ec77a18b563a00fa4e89dce1a092fce1f8e90d74))


### Bug Fixes

* clean up shop-single.html - remove header, fix layout ([e892495](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/e8924953fefb2d26aa84d106659613880400a793))
* convert contact and about pages to static HTML with Spanish nav ([2d70f56](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/2d70f561479ea2bccaeb8c6445ec00bc6189b1e6))
* remove th:insert fragments from shop-single for static serving ([8f8e935](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/8f8e935c4903be5477ec5bebab2f316da2eba4c4))
* update nav links to Spanish in index, shop, shop-single ([b9bf647](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/b9bf647da3c8b7da88e8c19027bab6c958b38c58))

## [1.1.0](https://github.com/Mianlo2386/BetoShop_NodeJS/compare/v1.0.0...v1.1.0) (2026-03-26)


### Features

* implement maintenance mode modal and read-only middleware ([c341a28](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/c341a282081e67e61195d40beea57d4632ca5182))
* implement maintenance mode modal and read-only middleware ([3549457](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/3549457db2053455b86ed3ace69b431623afe156))


### Bug Fixes

* remove broken endpoints-contract test with invalid relative paths ([e2eb6ab](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/e2eb6abd2c0eaca6a4ddb3abaa56a1fafcb275df))

## 1.0.0 (2026-03-26)


### Features

* **ci:** add Claude AI security review workflow ([eb4b7ac](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/eb4b7acdb174cfb2813cd3a4419c417848e08daf))
* **ci:** add GitHub Actions workflow for Vitest test suite ([48471f8](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/48471f84e2a5cfa7454ae65bbe09d3b348e601a5))
* implement automatic versioning and AI release notes flow ([344dd60](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/344dd603037b1cf3cdd3b056d6e6a10df13c7b11))
* implement automatic versioning and AI release notes flow ([551a917](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/551a917dcdefb08e24a27f7374ddd698a7acc674))
* implement automatic versioning and AI release notes flow ([99d5ac6](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/99d5ac6a59c41ed4c43b9b5079115d735103f428))
* setup security review and backend environment validation ([e632df6](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/e632df6b5f0b34e483f1c487a1c3e544fc9ae30c))
* setup security review and backend environment validation ([764b0d5](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/764b0d5355c0d6794e842c1d0bae51902190fa5e))
* trigger release-please ([870167f](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/870167ffad19e85ff9bf023ee4045d7b00fb27ef))


### Bug Fixes

* add checkout step to release-please ([8f7f6ca](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/8f7f6cada72e6c3e4e7665e6594a10682efcee79))
* add default-branch to release-please ([0dad8f0](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/0dad8f00e7b17a1fba29c7df6f108be2d76fc583))
* add GITHUB_TOKEN and permissions to release-please ([ce2ecfa](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/ce2ecfaee98501f7baf3412259c51f05a2caace4))
* add package-name to release-please ([8eb9fae](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/8eb9fae39effd4064769dee4a972e814123ab09c))
* add path parameter to release-please for backend ([0978cd3](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/0978cd3af32beaec17e147629b385f8d9c186291))
* **ci:** add NODE24 flag to release-please ([b8bd4ec](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/b8bd4ec1beb92b2d45acce0d3e43c9a5812831ab))
* **ci:** add NODE24 force flag to security-review ([15640a5](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/15640a5a92210a94719a97864daed65c5f7b86e7))
* **ci:** add NODE24 force flag to security-review ([bbd401b](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/bbd401b754541134937f910d1b46e448808efa8c))
* **ci:** hardcode node version and fix yaml syntax ([e04ba87](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/e04ba87ae93e5fb000cbc1d43c91682d65e78bb6))
* **ci:** move NODE24 force flag to global env level ([c682fb2](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/c682fb2d5d32658da92c8e1f783d2537e1197bdd))
* **ci:** simplify workflow and remove problematic coverage step ([121b5c8](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/121b5c87755157bb17309a00a30c78179e620b92))
* **ci:** update workflow for Node 24 compliance and coverage ([3654b1b](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/3654b1b5cc4d60a19b2ec207cbea092d02238e64))
* **ci:** upgrade to actions@v5 (Node 24 native support) ([e1f47a1](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/e1f47a199366c371535816519ab15889136e59a4))
* copy package.json to root for release-please ([9efb9d4](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/9efb9d4e3e73d37ff30e994ca30457969eddcf39))
* correct yaml syntax and indentation in security workflow ([8d954e2](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/8d954e278d1e38cc81e7d11b73c4b5656fa4d523))
* fix permissions for release-please ([7b5e52d](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/7b5e52d75928f67348a332dd03b632ea0c1c543c))
* move NODE24 flag to workflow level ([f5f381a](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/f5f381a71b5be86230a1b0cf5b78a5505fe5e74e))
* update action input name to claude-api-key ([6d82180](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/6d821803b25d9ef6f3d33f8b139ad9bb68fa1bc7))
* update release-please-action to v4.1.0 ([96299a7](https://github.com/Mianlo2386/BetoShop_NodeJS/commit/96299a7a590186467c5349fe223c0af27a798f63))
