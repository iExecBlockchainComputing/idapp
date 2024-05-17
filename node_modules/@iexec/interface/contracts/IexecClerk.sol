pragma solidity >0.5.0 <0.7.0;
pragma experimental ABIEncoderV2;

import "./libs/IexecODBLibCore.sol";
import "./libs/IexecODBLibOrders.sol";


interface IexecClerkInterface
{
	/***************************************************************************
	 *                                 ESCROW                                  *
	 ***************************************************************************/
	event Deposit   (address owner, uint256 amount);
	event DepositFor(address owner, uint256 amount, address target);
	event Withdraw  (address owner, uint256 amount);
	event Reward    (address user,  uint256 amount, bytes32 ref);
	event Seize     (address user,  uint256 amount, bytes32 ref);
	event Lock      (address user,  uint256 amount);
	event Unlock    (address user,  uint256 amount);

	function token()                                                                   external view returns (address);
	function viewAccount    (address _user)                                            external view returns (IexecODBLibCore.Account memory account);
	function deposit        (uint256 _amount)                                          external returns (bool);
	function depositFor     (uint256 _amount, address _target)                         external returns (bool);
	function depositForArray(uint256[] calldata _amounts, address[] calldata _targets) external returns (bool);
	function withdraw       (uint256 _amount)                                          external returns (bool);

	/***************************************************************************
	 *                                  RELAY                                  *
	 ***************************************************************************/
	event BroadcastAppOrder       (IexecODBLibOrders.AppOrder        apporder       );
	event BroadcastDatasetOrder   (IexecODBLibOrders.DatasetOrder    datasetorder   );
	event BroadcastWorkerpoolOrder(IexecODBLibOrders.WorkerpoolOrder workerpoolorder);
	event BroadcastRequestOrder   (IexecODBLibOrders.RequestOrder    requestorder   );

	function broadcastAppOrder       (IexecODBLibOrders.AppOrder        calldata _apporder       ) external;
	function broadcastDatasetOrder   (IexecODBLibOrders.DatasetOrder    calldata _datasetorder   ) external;
	function broadcastWorkerpoolOrder(IexecODBLibOrders.WorkerpoolOrder calldata _workerpoolorder) external;
	function broadcastRequestOrder   (IexecODBLibOrders.RequestOrder    calldata _requestorder   ) external;

	/***************************************************************************
	 *                                IEXECHUB                                 *
	 ***************************************************************************/
	event OrdersMatched        (bytes32 dealid, bytes32 appHash, bytes32 datasetHash, bytes32 workerpoolHash, bytes32 requestHash, uint256 volume);
	event ClosedAppOrder       (bytes32 appHash);
	event ClosedDatasetOrder   (bytes32 datasetHash);
	event ClosedWorkerpoolOrder(bytes32 workerpoolHash);
	event ClosedRequestOrder   (bytes32 requestHash);
	event SchedulerNotice      (address indexed workerpool, bytes32 dealid);

	function WORKERPOOL_STAKE_RATIO() external view returns (uint256);
	function KITTY_RATIO           () external view returns (uint256);
	function KITTY_MIN             () external view returns (uint256);
	function GROUPMEMBER_PURPOSE   () external view returns (uint256);
	function EIP712DOMAIN_SEPARATOR() external view returns (bytes32);
	function iexechub              () external view returns (address);

	function viewRequestDeals(bytes32 _id) external view returns (bytes32[] memory requestdeals);
	function viewDeal        (bytes32 _id) external view returns (IexecODBLibCore.Deal memory deal);
	function viewConsumed    (bytes32 _id) external view returns (uint256 consumed);
	function viewPresigned   (bytes32 _id) external view returns (bool presigned);

  function verifySignature(address _identity, bytes32 _hash, bytes calldata _signature) external view returns (bool);

	function signAppOrder       (IexecODBLibOrders.AppOrder        calldata _apporder       ) external returns (bool);
	function signDatasetOrder   (IexecODBLibOrders.DatasetOrder    calldata _datasetorder   ) external returns (bool);
	function signWorkerpoolOrder(IexecODBLibOrders.WorkerpoolOrder calldata _workerpoolorder) external returns (bool);
	function signRequestOrder   (IexecODBLibOrders.RequestOrder    calldata _requestorder   ) external returns (bool);

	function cancelAppOrder       (IexecODBLibOrders.AppOrder        calldata _apporder       ) external returns (bool);
	function cancelDatasetOrder   (IexecODBLibOrders.DatasetOrder    calldata _datasetorder   ) external returns (bool);
	function cancelWorkerpoolOrder(IexecODBLibOrders.WorkerpoolOrder calldata _workerpoolorder) external returns (bool);
	function cancelRequestOrder   (IexecODBLibOrders.RequestOrder    calldata _requestorder   ) external returns (bool);

	function matchOrders(
		IexecODBLibOrders.AppOrder        calldata _apporder,
		IexecODBLibOrders.DatasetOrder    calldata _datasetorder,
		IexecODBLibOrders.WorkerpoolOrder calldata _workerpoolorder,
		IexecODBLibOrders.RequestOrder    calldata _requestorder)
	external returns (bytes32);

	function viewDealABILegacy_pt1(bytes32 _id)
	external view returns
	( address
	, address
	, uint256
	, address
	, address
	, uint256
	, address
	, address
	, uint256
	);

	function viewDealABILegacy_pt2(bytes32 _id)
	external view returns
	( uint256
	, bytes32
	, address
	, address
	, address
	, string memory
	);

	function viewConfigABILegacy(bytes32 _id)
	external view returns
	( uint256
	, uint256
	, uint256
	, uint256
	, uint256
	, uint256
	);

	function viewAccountABILegacy(address _user)
	external view returns (uint256, uint256);
}
