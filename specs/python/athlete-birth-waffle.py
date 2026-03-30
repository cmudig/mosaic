from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


athletes = DataSource(
    type="parquet",
    file="data/athletes.parquet",
    where=""
)

spec = Plot(
    plot=[
        PlotMark(WaffleY(
            mark="waffleY",
            data=PlotFrom(from_="athletes"),
            unit=$unit,
            round=$round,
            gap=$gap,
            rx=$radius,
            x=ChannelValueSpec(ChannelValue(sql='5 * floor(year("date_of_birth") / 5)')),
            y=ChannelValueSpec(ChannelValue(count=""))
        ))
    ],
    xLabel=None,
    xTickSize=0,
    xTickFormat="d"
)
