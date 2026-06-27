# Ngx-wig

![screen shot 2017-12-12 at 14 52 51](https://user-images.githubusercontent.com/1526680/33888069-37bde1f0-df4c-11e7-993e-d48ffe0fffbf.png)


## Features

 - Template-driven forms
 - Reactive forms
 - Custom placeholder
 

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


## Basic usage

Import the `NgxWigNodule`:

```ts
import {NgxWigModule} from 'ngx-wig';

@Component({
  imports: [NgxWigModule]
});
export class MyCmp {
  text = 'Hello World';
}
```

Add the following snippet to your template:

```html
<ngx-wig [content]="text" />
```

## Advanced usage

### Define visible buttons

```html
<ngx-wig [buttons]="'bold, italic'" />
```

### Get notified when content changes

```html
<ngx-wig (contentChange)="result = $event" />
```

### Customize styles on paste

```ts
providers: [
  {
    provide: NgxWigFilterService,
    useClass: NgxWigFilterStylesService
  }
]
```

### Adding custom buttons

https://stackblitz.com/edit/ngx-wig-sample-plugins?file=src/app.ts

