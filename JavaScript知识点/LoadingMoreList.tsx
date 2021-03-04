import React, { useCallback, useLayoutEffect, useRef } from "react";
import {
  List as VList,
  AutoSizer,
  InfiniteLoader,
  CellMeasurerCache,
  CellMeasurer
} from "react-virtualized";
import { LoadingIcon } from "svg";
import styles from "./index.scss";
import "resize-observer-polyfill";


interface IProps {
  height?: number; // list的高度，不传也会AutoSizer去计算

  rowCount: number; // 有多少行
  rowHeight?: number | (({ index }) => number); // 行高度，可以不传，不传的话会使用CellMeasure进行计算
  /**
   * 每一行的渲染函数
   * 值得注意的是，registerChild和measure只会在不传rowHeight的时候有，它们是CellMeasure的参数
   */
  renderRow: (param: { index: number, registerChild?: any, measure?: (() => void) }) => React.ReactNode; 

  hasMore: boolean; // 是否还能继续加载更多
  threshold?: number; // 触发加载

  className?: string; // virtualList的类名
  rowClassName?: string; // 每一行的类名

  renderBottomBar?: () => React.ReactNode; // 底部加载中 自定义渲染函数
  renderNoRow?: () => JSX.Element; // 空内容 自定义渲染函数

  onLoadMore: () => Promise<void>; // 加载更多回调
}
export default React.forwardRef<VList, IProps>((props, ref) => {
  const {
    renderRow,
    height,
    className,
    rowCount,
    rowHeight,
    rowClassName,
    hasMore,
    threshold = 15,
    renderNoRow,
    renderBottomBar,
    onLoadMore
  } = props;
  
  /**
   * 是否在加载更多中
   * 由于InfiniteLoader可能在一次滚动中触发多次loadMoreRows回调
   */
  const loadingRef = useRef(false);
  /**
   * 高度计算cache
   * CellMeasurerCache
   */
  const cacheRef = useRef(
    new CellMeasurerCache({
      defaultHeight: 20,
      fixedWidth: true
    })
  );
  /**
   * InfiniteLoader的回调
   */
  const loadMoreRows = useCallback(
    async (_) => {
      if (loadingRef.current || !hasMore) {
        return;
      } else {
        return onLoadMore && typeof onLoadMore === "function" && onLoadMore();
      }
    },
    [hasMore, onLoadMore]
  );

  /**
   * 某一行是否已经加载了
   * 还没加载的是 指示器
   */
  const isRowLoaded = useCallback(({ index }) => index < rowCount, [rowCount]);

  //===== 适配下List的参数 =====//
  const rowRenderer = ({ index, key, style, parent }) => {
    const renderDefaultBottomBar = () => {
      return hasMore ? (
        <div className={styles.loadMore}><LoadingIcon />正在加载</div>
      ) : (
          <div className={styles.loadMore}>没有更多了</div>
        )
    };
    if (rowHeight) {
      return isRowLoaded({ index }) ? (
        <div key={key} style={style} className={rowClassName}>
          {renderRow({ index })}
        </div>
      ) : (
          <div key={key} style={style}>
            {renderBottomBar ? renderBottomBar() : renderDefaultBottomBar()}
          </div>
        );
    } else {
      return isRowLoaded({ index }) ? (
        <CellMeasurer
          rowIndex={index}
          columnIndex={0}
          key={key}
          parent={parent}
          cache={cacheRef.current}
        >
          {
            ({ registerChild, measure }) => (
              <div style={style} className={rowClassName}>
                {renderRow({ index, registerChild, measure })}
              </div>
            )
          }
        </CellMeasurer>
      ) : (
          <CellMeasurer
            index={index}
            rowIndex={index}
            columnIndex={0}
            key={key}
            parent={parent}
            cache={cacheRef.current}
          // style={style}
          >
            <div style={style}>
              {renderBottomBar ? renderBottomBar() : renderDefaultBottomBar()}
            </div>
          </CellMeasurer>
        );
    }

  };
  const noRowsRenderer = useCallback<() => JSX.Element>(() => {
    if (renderNoRow) {
      return renderNoRow();
    } else {
      return (
        <div style={{
          textAlign: "center"
        }}>无数据</div>
      );
    }
  }, [renderNoRow]);

  return (
    <AutoSizer disableHeight={!!height}>
      {({ width, height: autoHeight }) => (
        <InfiniteLoader
          isRowLoaded={isRowLoaded}
          loadMoreRows={loadMoreRows}
          rowCount={rowCount + 1}
          threshold={threshold}
        >
          {({ onRowsRendered, registerChild }) => (
            <VList
              className={className}
              ref={(el) => {
                registerChild(el);
                if (ref) ref.current = el;
              }}
              deferredMeasurementCache={!rowHeight ? cacheRef.current : null}
              height={height || autoHeight}
              width={width}
              rowCount={hasMore ? rowCount + 1 : rowCount}
              rowHeight={rowHeight || cacheRef.current.rowHeight}
              onRowsRendered={onRowsRendered}
              noRowsRenderer={noRowsRenderer}
              rowRenderer={rowRenderer}
            />
          )}
        </InfiniteLoader>
      )}
    </AutoSizer>
  );
});

/**
 * 元素为 动态高度 时，需要用这个来包裹，以确保高度重新计算正确
 */
export const LoadMoreItemResizeWrapper = (props: React.PropsWithChildren<{ measure: () => void }>) => {
  const ref = useRef<HTMLDivElement>();
  useLayoutEffect(() => {
    // 已加polyfill
    console.log(props.measure);
    const observer = new ResizeObserver(() => {
      props.measure();
    });
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
    }
  }, []);
  return (
    <div ref={ref}>
      {props.children}
    </div>
  );
}
