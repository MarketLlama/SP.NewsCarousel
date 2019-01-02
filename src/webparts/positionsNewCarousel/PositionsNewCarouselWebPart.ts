import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-webpart-base';

import * as strings from 'PositionsNewCarouselWebPartStrings';
import PositionsNewCarousel from './components/PositionsNewCarousel';
import { IPositionsNewCarouselProps } from './components/IPositionsNewCarouselProps';

export interface IPositionsNewCarouselWebPartProps {
  description: string;
}

export default class PositionsNewCarouselWebPart extends BaseClientSideWebPart<IPositionsNewCarouselWebPartProps> {

  public render(): void {
    const element: React.ReactElement<IPositionsNewCarouselProps > = React.createElement(
      PositionsNewCarousel,
      {
        description: this.properties.description,
        context : this.context
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
