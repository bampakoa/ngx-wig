# Ngx-wig

![screen shot 2017-12-12 at 14 52 51](https://user-images.githubusercontent.com/1526680/33888069-37bde1f0-df4c-11e7-993e-d48ffe0fffbf.png)


## Angular Support

Library versions are directly compatible with the respective Angular version (e.g. For **Angular 21** `npm install ngx-wig@21`)

## Icons

Icons are not in the pack!
You can use the icons that you like.
We recommend to use [Material Design Icons](https://cdn.materialdesignicons.com/2.1.19/css/materialdesignicons.min.css)

If you do not want to use a full icons set, you can use these steps:

1. Go to [icons set](https://materialdesignicons.com/)
1. Choose the icon that you want, press the right mouse button on it, and then select the "View SVG" option
1. Go to [URL-encoder for SVG](https://yoksel.github.io/url-encoder/) and use it to convert your SVG

## Installation

Ngx-wig could be simply installed via npm:

    npm install ngx-wig


## Usage

First, import the `ngx-wig` to your module:

```ts
import {NgxWigModule} from 'ngx-wig';

@NgModule({
  imports: [ NgxWigModule ]
});
```

it's just an attribute directive for textarea:

```html
<ngx-wig [content]="text1"></ngx-wig>
```

## Examples

### Quick start ( [demo](https://stackblitz.com/edit/stackblitz-starters-61ajke?file=src%2Fmain.ts) )

```html
<ngx-wig [content]="text1"></ngx-wig>
```

### Placeholder ( [demo](https://stackblitz.com/edit/stackblitz-starters-5lq68z?file=src%2Fmain.ts) )

```html
<ngx-wig [content]="text1" [placeholder]="'Enter instructions here.'"></ngx-wig>
```

### Template forms ( [demo](https://stackblitz.com/edit/stackblitz-starters-go26xc?file=src%2Fmain.ts) )

```html
<ngx-wig [(ngModel)]="text1"></ngx-wig>
<ngx-wig [(ngModel)]="text1"></ngx-wig>
```

### Set buttons ( [demo](https://stackblitz.com/edit/stackblitz-starters-qohotg?file=src%2Fmain.ts) )

```html
<ngx-wig [content]="text1" [buttons]="'bold, italic'"></ngx-wig>
```

### onContentChange Hook ( [demo](https://stackblitz.com/edit/stackblitz-starters-cl6k3s?file=src%2Fmain.ts) )

```html
<ngx-wig [content]="text1" (contentChange)="result = $event"></ngx-wig>
<div [innerHTML]="result"></div>
```

### Reactive forms ( [demo](https://stackblitz.com/edit/stackblitz-starters-hgna7m?file=src%2Fmain.ts) )

```html
<ngx-wig [formControl]="text1"></ngx-wig>
```


### Adding own buttons

Please check an example here
https://stackblitz.com/edit/ngx-wig-sample-plugins?file=src/app.ts


### Filtering/removing extra styles on paste ( [demo](https://stackblitz.com/edit/stackblitz-starters-ysmo2d?file=src%2Fmain.ts) )

```typescript
providers: [{ provide: NgxWigFilterService, useClass: NgxWigFilterStylesService}]
```



## Development

```bash
$ npm start
```

To lint all `*.ts` files:

```bash
$ npm run lint
```

To run all tests:

```bash
$ npm run test
```
