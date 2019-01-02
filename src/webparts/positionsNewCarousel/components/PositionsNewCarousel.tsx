import * as React from 'react';
import styles from './PositionsNewCarousel.module.scss';
import { IPositionsNewCarouselProps } from './IPositionsNewCarouselProps';
import {IPositionsNewCarouselState } from './IPositionsNewCarouselState';
import { escape } from '@microsoft/sp-lodash-subset';
import { SPComponentLoader } from '@microsoft/sp-loader';
import {sp , Web}  from '@pnp/pnpjs';
import { Item } from '@pnp/sp';
import Slider from "react-slick";

export interface newsItem {
  Title : string;
  NewsDate : string;
  PageId : number;
  PageURL : string;
  NewsTeaser : string;
  ImgageURL : string;
  HighlightNews : boolean;
  ShowImage : boolean;
}

export default class PositionsNewCarousel extends React.Component<IPositionsNewCarouselProps, IPositionsNewCarouselState> {
  constructor(props) {
    super(props);
    this.state = {
        news : [],
        selectedItem : 0
    };
  }

  private _getAllNews = async () : Promise<newsItem[]> =>{
    return new Promise<newsItem[]>((resolve, reject) =>{ 
      let newsItems : newsItem[] = [];
      const web = new Web(this.props.context.pageContext.site.absoluteUrl + '/articles');

      web.lists.getByTitle('News').items
        .select("Title", "NewsDate", "NewsTeaser", "NewsImage", "TopNews", "HighlightNews", "ShowImage", "Page/ID").filter('TopNews eq 1')
        .orderBy('NewsDate').expand("Page").top(5).get().then(items =>{

        let promises = [];
        items.forEach(item => {
          
          let htmlValues = new Item(web.lists.getByTitle('Pages').items.getById(item.Page.ID), "FieldValuesAsHtml");
          let textValue = new  Item(web.lists.getByTitle('Pages').items.getById(item.Page.ID), "FieldValuesAsText");

          let imagePromise =  htmlValues.select("PublishingRollupImage").get();
          let fileRefPromise =  textValue.select("FileRef").get();

          let promise = new Promise((_resolve, _reject) =>{
            Promise.all([imagePromise,fileRefPromise]).then((promiseValues) =>{
                _resolve({
                  image : promiseValues[0].PublishingRollupImage,
                  file : promiseValues[1].FileRef,
                  item : item
                });
            });
          });
          promises.push(promise);
        });
        //TODO: Fix spaghetti code. 
        Promise.all(promises).then(_items =>{
          _items.forEach(item =>{
            //Get src of publishing image 
            //Mark sure RenditionID is within query string or performace will be shite.
            const image = item.image;
            let imageSrc : string = "";
            if(item.item.NewsImage == null){
              if (image !== null && image.length > 1) {
                  const src = /src\s*=\s*"(.+?)"/ig.exec(image);
                  // this wil be the value of the PublishingPageImage field
                if(src[1].indexOf('?') !== -1){
                  imageSrc = src[1].replace("?RenditionID=10", "?RenditionID=10");
                } else {
                  imageSrc = src[1] + "?RenditionID=10";
                }
              } else {
                imageSrc = '';
              } 
            } else {
              imageSrc = item.item.NewsImage;
            }

            newsItems.push({
              Title : item.item.Title,
              NewsDate : item.item.NewsDate,
              PageId : item.item.Page.ID,
              PageURL : item.file,
              NewsTeaser : item.item.NewsTeaser,
              ImgageURL : imageSrc,
              HighlightNews : item.item.HighlightNews,
              ShowImage : item.item.ShowImage
            });
          });
          resolve(newsItems);
        });
        
      }, _error =>{
        reject(newsItems);
      });
    });
  }
  
  public render(): React.ReactElement<IPositionsNewCarouselProps> {

    SPComponentLoader.loadCss('https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.6.0/slick.min.css');
    SPComponentLoader.loadCss('https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.6.0/slick-theme.min.css');

    var settings = {
      dots: false,
      infinite: true,
      speed: 500,
      slidesToShow: 1,
      slidesToScroll: 1,
      autoplay : true
    };
    return (
      <div className={ styles.positionsNewCarousel }>
         <Slider {...settings}>
          {this.state.news}
         </Slider>
      </div>
    );
  }

  public createNewsFlow = async () => {
    let newsItems : newsItem[] = await this._getAllNews();
    let news = [];
    for (let i = 0; i < newsItems.length ; i++) {
      news.push(this._onRenderNewsCell(newsItems[i]));
    }
    this.setState({
      news : news
    });  
  }

  public componentDidMount() {
    this.createNewsFlow();
  }

  private _onRenderNewsCell = (item : newsItem) : JSX.Element =>{
    return (
      <div onClick={() => window.location.href = item.PageURL}>
          <div style={{backgroundSize : 'cover', backgroundImage : 'url(' + item.ImgageURL + ')', height: '350px'}}>
            <div className={styles["carousel-caption"]}>        
              <h3 className={styles["news-title"]}>{item.Title}</h3>
              <p>{item.NewsTeaser}</p>                 
            </div> 
          </div>
      </div>
    );
  }
}