# Twitter search slack notificator

Twitterで指定 のキーワードを検索して、Slackに通知するAWS Lambda Function


## 開発

`index.js` が本体であり、AWS Lambdaは `index.handler` 関数を実行するようになっています。

開発時には直接 `index.js` を実行することはできないため、 `driver.js` というAWS Lambdaをエミュレートするスクリプトを用意してそれを実行するようにしています。

以下のコマンドで、 `driver.js` が実行できるようになっています。

```
$ docker-compose run --rm lambda
```

## 環境変数

機密情報に関しては、環境変数から渡すようになっています。  
AWS Lambda Functionや、開発時は `.env` に以下の内容を設定する必要があります。

| 変数名 | 内容 |
| --- | --- |
| S3_BUCKET | 最終取得ツイートIDを保持するS3バケットの名前を指定します |
| SLACK_WEBHOOK_URL | 通知先のWebHook URL (現時点では投稿channelを指定できないので、デフォルトのchannelを通知したいchannelに設定しておいてください) |
| TWITTER_CONSUMER_KEY | Twitterのコンシューマーキー |
| TWITTER_CONSUMER_SECRET | Twitterのコンシューマーシークレット |
| TWITTER_ACCESS_TOKEN | Twitterのアクセストークン |
| TWITTER_ACCESS_TOKEN_SECRET | Twitterのアクセストークンシークレット |


**開発環境やデプロイ環境の場合のみ以下の環境変数もセットする必要があります。**

| 変数名 | 内容 |
| --- | --- |
| AWS_ACCESS_KEY_ID | - |
| AWS_SECRET_ACCESS_KEY | - |
| AWS_REGION | - |


## デプロイ

### 準備

`lambda-config.js` でデプロイ対象のLambdaについて設定を書きます。

`role`や`functionName`を各々の環境に合わせて書き換えてください。  
このLambda FunctionはS3にアクセス（読み書き）することになるので、S3への読み書き権限が必要です。

`lambda-config.js`に記載している設定値の変更、または、デフォルトの設定値を知りたい場合は、[node-aws-lambda のドキュメント](https://www.npmjs.com/package/node-aws-lambda)を参照してください。

### デプロイ

下記のコマンドで、ビルドとLambdaへのアップロードまで完了します。

```
$ docker-compose run --rm lambda npm run deploy
```



ビルド(zipファイルの作成)のみを行う場合は、以下のようなコマンドを実行します。  

```
$ docker-compose run --rm lambda npm run build
```

これを実行すると、 `./dist/` ディレクトリと それをzipした `./dist.zip` ファイルが作成されます。


## 仕組み

### 最終取得ツイートIDの取得・保存

前回の実行からかぶりなくツイートを検索するために、前回取得したツイートの最後のIDを保存しておき、そのツイートよりもあとにツイートされたものを検索します。

AWS Lambda Functionはステートレスなので、S3に最終取得ツイートIDを保存・取得することでツイートIDの保持を行っています。

### 定期実行

CloudWatch Eventを利用し、定期的（15分ごと）にこのLambda Functionを実行します。

設定値(最新の設定はAWS Lambdaの設定画面を参照してください)

```
cron(0/15 * * * ? *)
```

