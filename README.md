## Overview
Fanso project

## License
This product is private. do NOT copy or use if have not license.
## Copyright / Author
- Thangchin.co <contact@thangchin.co>
- Tech <tuong.tran@outlook.com>

## Setup

### API
1. Go to api folder, create `.env` file from `config-example > env > api.env`
2. Replace with your configuration
3. Run `yarn` to install dependecies
4. Run `yarn start:dev` for dev env or `yarn build && yarn start` from prod env

### User
1. Go to user folder, create `.env` file from `config-example > env > user.env`
2. Replace with your configuration
3. Run `yarn` to install dependecies
4. Run `yarn dev` for dev env or `yarn build && yarn start` from prod env
5. Open browser and enter `localhost:8081` with `8081` is default port of User

### Admin
1. Go to admin folder, create `.env` file from`config-example > env > admin.env`
2. Replace with your configuration
3. Run `yarn` to install dependecies
4. Run `yarn dev` for dev env or `yarn build && yarn start` from prod env
5. Open browser and enter `localhost:8081` with `8082` is default port of Admin

### Change log

- 1.1.0

* FS-231 - Unable to cancel the subscription as while page loads for a long time and nothing happens
* FS-194 - "Model intro video once edited by model cant be viewed, the video disappears"
* FS-229 - "Model unblocking a user, the reason is auto populated which should be removed"
* FS-217 - The subscription is not auto renewal
* FS-226 - The user name is not fetched when admin is creating a subscription from the backend
* FS-227 - "QA server , it says -1 followers even with active subscriptions"
* FS-211 - [Technical] Load env dynamically
* FS-203 - Mobile Web- Responsive UI issues in Edit profile tabs of the Model Profile
* FS-190 - No option to remove thumbnail picture for video or photo feed
* FS-178 - "Chats, The smilieys are found down and the side tabs are not working"
* FS-214 - [User] [Model detail] height of welcome video should smaller
* FS-201 - "QA site ,The bookmarks tab flicker"
* FS-216 - Payed out tokens by admin does not reflect in the token earnings of Model
* FS-209 - "Payment process for a longer time, when unlocking a video via tokens but nothing happens,, but once refreshed the page, its unlocked automatically"
* FS-193 - "Any media file selected to upload in site, doesn't display the image name"
* FS-206 - "When adding a Video feed,, the option to add one more video should be removed"
* FS-195 - "Admin unable to edit the XX date ,until which the models subscription is free"
* FS-207 - Cannot view Purchased Gallery from token transactions
* FS-191 - There is no option to view or edit the intro video posted by the admin
* FS-192 - "Bulk - upload video from admin , after uploading and active,, it says no video found"
* FS-205 - Gallery image is broken in the production site
* FS-185 - Models earning page- cant filter by monthy or yearly subscriptions
* FS-208 - Unblocking works at the 2nd attempt only
* FS-112 - "Video details page, there is no option to go back"
* FS-155 - Unable to add digital files and edit them